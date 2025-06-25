type TransferRecord = {
    data: any;
    expires: number;
};

declare global {
  // We use `var` here because `let` or `const` would not be re-declarable.
  // This is necessary for the global object to persist across hot-reloads in development.
  // eslint-disable-next-line no-var
  var transferStore: Map<string, TransferRecord> | undefined;
}

// This check prevents the store from being reset during hot-reloads in development
// by ensuring that it's only initialized once.
if (!global.transferStore) {
  global.transferStore = new Map();
}

const transferStore = global.transferStore;

export default transferStore;
