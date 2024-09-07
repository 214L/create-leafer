#!/bin/bash

set -e 

REMOTE_REPO="git@github.com:leaferjs/LeaferX.git"  
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd) 
TARGET_DIR="$SCRIPT_DIR/../template/base"  
echo $TARGET_DIR
TEMP_DIR=$(mktemp -d)  

git clone $REMOTE_REPO $TEMP_DIR

rm -rf $TEMP_DIR/.git

find $TEMP_DIR -name ".*" -exec bash -c '
for filepath; do
    filename=$(basename "$filepath")
    dirname=$(dirname "$filepath")
    mv "$filepath" "$dirname/_${filename:1}"
done
' bash {} +

echo "Preparing to clear the target directory: $TARGET_DIR"
read -p "Are you sure you want to proceed? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
  echo "Operation aborted."
  exit 1
fi

rm -rf $TARGET_DIR/*
mkdir -p $TARGET_DIR

cp -r $TEMP_DIR/. $TARGET_DIR/

echo "Temporary directory: $TEMP_DIR"

rm -rf $TEMP_DIR

echo "Files have been synchronized to $TARGET_DIR, hidden files have been renamed, and Git information has been removed."