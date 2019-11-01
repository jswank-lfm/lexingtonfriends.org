#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o xtrace

SRHT_INSTALL_SCRIPT=""
SRHT_SECRETS=${SRHT_SECRETS:=""}
SRHT_CHDIR=${SRHT_CHDIR:=""}
SRHT_SCRIPT=$(realpath $0)

ChangeBranch() {
  echo "git checkout $1"
}

srht() {

  #
  # start non-exported funcs
  #

  usage() {
  cat <<EOF
builds.sr.ht utility functions.

Install functions for subsequent use: srht-funcs.sh -i

Once installed, environment variables control whether some basic functionality
is exposed to subsequent build tasks.  These environment variables can be set 
in the build manifest.

  SRHT_SECRETS - if set to an existing filename, the file is sourced to set
                  environment variables. Such a file can be created via sr.ht 
                  secrets functionality.

  SRHT_CHDIR   - if set to an existing directory, tasks will use this as the
                 current working directory

Additionally, some utility functions become available to your tasks:

 ChangeBranch <branch> - checks out the specified branch from the git repo in the 
                         current directory

EOF
  }

  init() {

    OPTIND=1

    while getopts "h?i?" opt; do
        case "$opt" in
        h|\?)
            usage
            exit 0
            ;;
        i)  
            SRHT_INSTALL_SCRIPT=true
            ;;
        esac
    done

    shift $((OPTIND-1))

  }

  # add . <full_path_to_script> to ~/.buildenv 
  installScript() {
    cat << EOI > ~/.buildenv
. ${SRHT_SCRIPT} 
EOI
  }

  importSecrets() {

    if [[ -e ${SRHT_SECRETS} ]]; then
      set +o xtrace
      . ~/${SRHT_SECRETS}
      set -o xtrace
    fi

  }

  changeDir() {

    if [[ -d ${SRHT_CHDIR} ]]; then
      popd ${SRHT_CHDIR}
    fi

  }

  #
  # end funcs
  #

  init $*

  if [[ -n ${SRHT_INSTALL_SCRIPT} ]]; then
    installScript
    exit 0
  fi

  importSecrets
  changeDir

}

srht $*
