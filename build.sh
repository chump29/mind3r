#!/usr/bin/env -S bash -e

for img in backend frontend; do
    pushd $img > /dev/null
    ./build.sh
    popd > /dev/null
done
