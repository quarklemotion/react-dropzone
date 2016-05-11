function readEntries(directory, callback, readerSupplied) {
  let entries = [];
  // reader should not be present on initial call
  const reader = readerSupplied || directory.createReader();

  return reader.readEntries((results) => {
    const toArray = obj => Array.prototype.slice.call(obj || [], 0);

    if (!results.length) {
      return callback(null, entries);
    }

    entries = entries.concat(toArray(results));
    return this.readEntries(directory, (err, additionalEntries) => {
      if (err) {
        return callback(err);
      }

      entries = entries.concat(additionalEntries);
      return callback(null, entries);
    }, reader);
  }, callback);
}

function walkDirectory(directory, callback) {
  let results = [];

  if (directory === null) {
    return callback(results);
  }

  return readEntries(directory, (err, result) => {
    if (err) {
      return callback(err);
    }

    const entries = result.slice();

    const processEntry = () => {
      const current = entries.shift();

      if (current === undefined) {
        return callback(results);
      }

      if (current.isDirectory) {
        return walkDirectory(current, (nestedResults) => {
          results = results.concat(nestedResults);
          processEntry();
        });
      }

      return current.file((file) => {
        results.push(file);
        return processEntry();
      }, processEntry);
    };
    return processEntry();
  });
}

export default function getDataTransferFiles(event, isMultipleAllowed = true) {
  let dataTransferItemsList = [];
  if (event.dataTransfer) {
    const dt = event.dataTransfer;
    if (dt.files && dt.files.length) {
      dataTransferItemsList = dt.files;
    } else if (dt.items && dt.items.length) {
      // During the drag even the dataTransfer.files is null
      // but Chrome implements some drag store, which is accesible via dataTransfer.items
      dataTransferItemsList = dt.items;
    }
  } else if (event.target && event.target.files) {
    dataTransferItemsList = event.target.files;
  }

  let flattenedDataTransferItems = [];
  Array.prototype.slice.call(dataTransferItemsList).forEach((listItem) => {
    if (typeof listItem.webkitGetAsEntry === 'function') {
      const entry = listItem.webkitGetAsEntry();

      walkDirectory(entry.filesystem.root, (walkedFiles) => {
        flattenedDataTransferItems.push(walkedFiles);
      });
    } else {
      flattenedDataTransferItems.push(listItem);
    }
  });

  if (flattenedDataTransferItems.length > 0) {
    flattenedDataTransferItems = isMultipleAllowed ? flattenedDataTransferItems : [flattenedDataTransferItems[0]];
  }

  // Convert from DataTransferItemsList to the native Array
  return flattenedDataTransferItems;
}
