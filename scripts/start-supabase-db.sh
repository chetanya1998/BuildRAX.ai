#!/usr/bin/env bash

set -uo pipefail

# Supabase publishes the local Postgres image to multiple public registries.
# GitHub-hosted runners share egress IPs, so any single registry can throttle
# otherwise valid CI runs. Try each official mirror before failing the job.
registries=(public.ecr.aws docker.io ghcr.io)

for registry in "${registries[@]}"; do
  echo "::group::Starting Supabase Postgres from ${registry}"

  if SUPABASE_INTERNAL_IMAGE_REGISTRY="${registry}" supabase db start; then
    echo "::endgroup::"
    exit 0
  fi

  echo "::warning::Supabase Postgres pull from ${registry} failed; trying the next registry."
  echo "::endgroup::"
done

echo "::error::Unable to start Supabase Postgres from any supported registry."
exit 1
