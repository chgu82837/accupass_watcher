#!/bin/bash

for i in {1..60}; do
    echo -en "\a" > /dev/tty5
    sleep 0.5
done
