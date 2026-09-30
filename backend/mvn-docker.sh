#!/usr/bin/env bash
# Runs Maven inside a Java 19 container (no local JDK 19 needed).
# Usage (from anywhere): bash backend/mvn-docker.sh verify
#
# - The repo is mounted read-only and copied into the container first:
#   compiling and classpath scanning directly on a Windows bind mount is
#   extremely slow. Test reports are copied back to backend/target/.
# - The Docker socket is mounted so Testcontainers can start PostgreSQL
#   as a sibling container, reached through host.docker.internal.
# - Maven's local repository is cached in the named volume demo-m2.
set -euo pipefail
cd "$(dirname "$0")/.."
# Git Bash on Windows: docker needs a C:/... path, which `pwd -W` gives.
REPO_ROOT="$(pwd -W 2>/dev/null || pwd)"

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "${REPO_ROOT}:/src:ro" \
  -v "${REPO_ROOT}/backend/target:/out" \
  -v demo-m2:/root/.m2 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  -e TESTCONTAINERS_RYUK_DISABLED=true \
  maven:3.9-eclipse-temurin-19 \
  bash -c '
    mkdir -p /work/backend /work/db
    cp -r /src/backend/pom.xml /src/backend/src /work/backend/
    cp -r /src/db/migrations /work/db/
    cd /work/backend
    set +e
    mvn -B "$@"
    status=$?
    rm -rf /out/surefire-reports /out/failsafe-reports
    cp -r target/surefire-reports target/failsafe-reports /out/ 2>/dev/null
    exit $status
  ' mvn "$@"
