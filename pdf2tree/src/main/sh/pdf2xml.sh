#!/bin/bash
(echo '<?xml version="1.1"?>' ; dumppdf.py -a -t $1) | sed -e 's/&#0;//g' > $2