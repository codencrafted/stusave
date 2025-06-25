type TransferRecord = {
    data: any;
    expires: number;
};

// Use a global object to persist the map across hot-reloads in development.
// This is not suitable for a production serverless environment where a distributed
// cache (e.g., Redis) or database should be used.
declare global {
  var transferStore: Map<string, TransferRecord> | undefined
}

const transferStore = global.transferStore || (global.transferStore = new Map());

export default transferStore;
