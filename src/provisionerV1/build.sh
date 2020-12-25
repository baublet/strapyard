#!/bin/bash

sudo apt-get update

# Install Docker
sudo apt-get remove -y docker docker-engine docker.io containerd runc
sudo apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg-agent \
  software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Ruby Version Manager
sudo apt-get install -y software-properties-common
sudo apt-add-repository -y ppa:rael-gc/rvm
sudo apt-get update -y
sudo apt-get install -y rvm

# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

# Install Codeserver
curl -fsSL https://code-server.dev/install.sh | sh

# Install Caddy for the webserver
echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" |
  sudo tee -a /etc/apt/sources.list.d/caddy-fury.list
sudo apt-get update
sudo apt-get install -y caddy
