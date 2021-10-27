#!/usr/bin/env sh

set -eu
sed -i "s/{{API_ENDPOINT}}/${API_ENDPOINT}/g" /etc/nginx/conf.d/default.conf
echo "/etc/nginx/config.d/default.conf: replacing placeholder '{{API_ENDPOINT}}' to ${API_ENDPOINT}"
exec "$@"