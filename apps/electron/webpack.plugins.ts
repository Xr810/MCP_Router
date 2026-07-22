// ForkTsCheckerWebpackPlugin is disabled: minimatch CJS/ESM interop
// (minimatch_1.default is not a function) breaks electron-forge start on this
// toolchain. Use `pnpm --filter @mcp_router/electron typecheck` instead.
export const plugins: unknown[] = [];
