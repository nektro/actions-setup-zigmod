const os = require("os");

const actions = require("@actions/core");
const cache = require("@actions/tool-cache")
const { Octokit } = require("@octokit/rest");
const { throttling } = require("@octokit/plugin-throttling");

const OctokitImpl = Octokit.plugin(throttling);

const octokit = new OctokitImpl({
    throttle: {
        onRateLimit: (retryAfter, options) => {
            octokit.log.warn(
                `Request quota exhausted for request ${options.method} ${options.url}`
            );
            // Retry twice after hitting a rate limit error, then give up
            if (options.request.retryCount <= 2) {
                console.log(`Retrying after ${retryAfter} seconds!`);
                return true;
            }
        },
        onAbuseLimit: (retryAfter, options) => {
            // does not retry, only logs a warning
            octokit.log.warn(
                `Abuse detected for request ${options.method} ${options.url}`
            );
        },
    },
});

const archMap = {
    x64: "x86_64",
    arm64: "aarch64",
};

const osMap = {
    linux: "linux",
    darwin: "macos",
    win32: "windows",
};

const extMap = {
    linux: "",
    darwin: "",
    win32: ".exe",
};

// most @actions toolkit packages have async methods
async function run() {
    return octokit.repos.listReleases({ owner: "nektro", repo: "zigmod" })
        .then((x) => x.data[0].assets)
        .then((x) => x.map(v => v.browser_download_url))
        .then((x) => x.filter(v => v.includes(archMap[os.arch()])))
        .then((x) => x.filter(v => v.includes(osMap[os.platform()])))
        .then((x) => x[0])
        .then((x) => Promise.all([
            cache.downloadTool(x),
            // pick version back out of url
            // ex: https://github.com/nektro/zigmod/releases/download/v59/zigmod-aarch64-linux
            x.split("/")[7].slice(1),
        ]))
        .then((x) => cache.cacheFile(x[0], `zigmod${extMap[os.platform()]}`, "zigmod", `0.${x[1]}.0`))
        .then((x) => actions.addPath(x))
        .catch((err) => {
            console.error(err.stack);
            actions.setFailed(err.message);
            process.exit(1);
        });
}

run();
