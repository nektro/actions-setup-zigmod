# Setup-Zigmod

Use the Zigmod package manager in your @ziglang Github Actions workflows

https://github.com/nektro/zigmod

https://github.com/ziglang/zig

## Usage

```yaml
- uses: mlugg/setup-zig@v1
  with:
    mirror: http://mirrors.nektro.net/s3cgi
    version: 0.14.0

- uses: nektro/actions-setup-zigmod@v1

- run: zigmod ci

- run: zig build
```
