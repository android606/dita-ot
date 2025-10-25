# Gitea Release Workflow Setup

This document explains the changes made to fix the "generate release notes" action for your Gitea repository.

## Changes Made

### 1. Updated Release Workflow (`release.yml`)

- **Replaced GitHub-specific action**: Changed `softprops/action-gh-release@v1` to `gitea-release-action@v1`
- **Added release notes generation**: Created a custom step that generates release notes from git commits
- **Updated repository conditions**: Changed all `github.repository == 'dita-ot/dita-ot'` to `github.repository == 'android/com.lifescan.specialization.dita.v1.3'`
- **Updated API URLs**: Changed GitHub-specific URLs to your Gitea instance

### 2. Updated Other Workflows

- **release-test.yml**: Updated repository condition
- **snapshot.yml**: Updated repository conditions for both dist and maven jobs

### 3. Release Notes Generation

The new release notes generation includes:
- Automatic changelog from git commits since last tag
- Build information (commit hash, build number, timestamp)
- Fallback for initial releases (shows last 20 commits)

## Required Setup

### 1. Gitea Token Secret

You need to create a `GITEA_TOKEN` secret in your repository settings:

1. Go to your Gitea repository: `https://git.android606.com/android/com.lifescan.specialization.dita.v1.3`
2. Navigate to Settings → Secrets and Variables → Actions
3. Create a new secret named `GITEA_TOKEN`
4. Use a Personal Access Token with the following scopes:
   - `repo` (full repository access)
   - `write:packages` (if using package registry)

### 2. Container Registry Secrets (Optional)

If you plan to use Docker image publishing, add these secrets:
- `CONTAINER_REGISTRY_USERNAME`: Your container registry username
- `CONTAINER_REGISTRY_TOKEN`: Your container registry token

### 3. Other Secrets (if needed)

Keep the existing secrets for Maven publishing and other integrations:
- `OSSRH_USERNAME`
- `OSSRH_PASSWORD`
- `GPG_PASSPHRASE`
- `GPG_ASC`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `HOMEBREW_COMMITTER_TOKEN`
- `REPOSITORY_DISPATCH`

## Testing the Fix

### 1. Create a Test Tag

```bash
# Create and push a test tag
git tag v1.0.0-test
git push origin v1.0.0-test
```

### 2. Monitor the Workflow

1. Go to Actions tab in your Gitea repository
2. Watch for the "Release" workflow to trigger
3. Check the logs for any errors

### 3. Verify Release Creation

1. Go to the Releases section of your repository
2. Verify that the release was created with:
   - Correct tag name
   - Generated release notes
   - Uploaded distribution files

## Troubleshooting

### Common Issues

1. **"Action not found" error**: Make sure you're using Gitea Actions runner that supports the `gitea-release-action`
2. **Authentication failed**: Verify your `GITEA_TOKEN` has the correct permissions
3. **API URL incorrect**: Ensure the `api_url` in the workflow matches your Gitea instance

### Manual Release Notes

If automatic generation fails, you can manually create release notes by:
1. Running the generation script locally
2. Creating a release manually in Gitea
3. Copying the generated content

## Workflow Features

The updated workflow now provides:

- ✅ **Gitea compatibility**: Uses Gitea-specific actions instead of GitHub-only ones
- ✅ **Automatic release notes**: Generates changelog from git commits
- ✅ **Proper repository targeting**: Only runs for your specific repository
- ✅ **Build information**: Includes commit hash, build number, and timestamp
- ✅ **File uploads**: Distributes build artifacts with the release
- ✅ **Error handling**: Graceful fallback for first-time releases

## Next Steps

1. Set up the required secrets in your Gitea repository
2. Test with a tag push
3. Monitor the workflow execution
4. Adjust the release notes template if needed
5. Consider adding more sophisticated changelog generation if required