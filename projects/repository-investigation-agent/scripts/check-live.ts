import { GitHubSourceAdapter } from '../src/lib/repository/source';

async function main() {
  const owner = 'octocat';
  const repo = 'Hello-World';
  const source = new GitHubSourceAdapter();
  const sha = await source.resolve(owner, repo);
  const tree = await source.tree(owner, repo, sha);
  if (!tree.some((entry) => entry.path === 'README' && entry.type === 'blob')) {
    throw new Error('README is missing from the pinned tree.');
  }
  const content = await source.file(owner, repo, sha, 'README');
  if (!content.trim()) throw new Error('Pinned README is empty.');
  console.log(JSON.stringify({
    repository: `${owner}/${repo}`,
    sha,
    path: 'README',
    firstLine: content.split(/\r?\n/)[0],
    permalink: `https://github.com/${owner}/${repo}/blob/${sha}/README#L1`,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
