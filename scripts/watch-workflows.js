const { execSync } = require('child_process');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function watchRuns() {
  let sha;
  try {
    sha = execSync('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim();
    if (!/^[0-9a-f]{40}$/.test(sha)) {
      console.error('Unexpected SHA format from git rev-parse.');
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed to get HEAD commit SHA.');
    process.exit(1);
  }

  console.log(`\n\x1b[36mWatching GitHub Actions workflows for commit ${sha}...\x1b[0m\n`);

  // Give GitHub some time to create the workflows after push
  await sleep(5000);

  let completedRuns = new Set();
  let firstCheck = true;
  let retryCount = 0;
  let inProgressTicks = 0;
  const MAX_IN_PROGRESS_TICKS = 60; // 10 min max once workflows start

  while (true) {
    let output;
    try {
      output = execSync(
        `gh run list --commit ${sha} --json name,status,conclusion,databaseId,url`,
        { stdio: 'pipe' },
      ).toString();
    } catch (e) {
      console.log('Failed to fetch runs from GitHub CLI. Is `gh` installed and authenticated?');
      await sleep(5000);
      continue;
    }

    let runs;
    try {
      runs = JSON.parse(output);
    } catch (e) {
      console.log('Failed to parse gh output. Retrying...');
      await sleep(5000);
      continue;
    }

    if (runs.length === 0) {
      if (retryCount > 12) {
        // 1 minute of waiting
        console.log('No workflows found for this commit after 1 minute. Exiting.');
        process.exit(0);
      }
      if (firstCheck || retryCount % 2 === 0) {
        process.stdout.write('Waiting for workflows to start...\n');
      }
      retryCount++;
      await sleep(5000);
      continue;
    }

    firstCheck = false;
    let allDone = true;

    for (const run of runs) {
      if (run.status !== 'completed') {
        allDone = false;
      } else {
        if (!completedRuns.has(run.databaseId)) {
          completedRuns.add(run.databaseId);
          if (run.conclusion === 'success') {
            console.log(`\x1b[32m✅ [Success]\x1b[0m ${run.name} (${run.url})`);
          } else {
            console.error(`\x1b[31m❌ [Failed]\x1b[0m ${run.name} (${run.url})`);

            // Fetch failed logs
            try {
              console.log(`\n\x1b[33m--- Logs for failed run (${run.name}) ---\x1b[0m`);
              const failedLog = execSync(`gh run view ${run.databaseId} --log-failed`, {
                stdio: 'pipe',
              }).toString();
              console.error(failedLog);
              console.log(`\x1b[33m--------------------------------------\x1b[0m\n`);
            } catch (e) {
              console.error('Could not fetch logs for this run.');
            }
          }
        }
      }
    }

    if (allDone) {
      console.log('\nAll workflows completed.');
      const anyFailed = runs.some((r) => r.conclusion !== 'success');
      process.exit(anyFailed ? 1 : 0);
    }

    inProgressTicks++;
    if (inProgressTicks > MAX_IN_PROGRESS_TICKS) {
      console.error(
        '\n\x1b[31m❌ Timed out waiting for workflows to complete after 10 minutes.\x1b[0m',
      );
      process.exit(1);
    }

    // Check every 10 seconds to avoid API rate limits
    await sleep(10000);
  }
}

watchRuns().catch((e) => {
  console.error(e);
  process.exit(1);
});
