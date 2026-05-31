#!/usr/bin/env -S bash -e

_red="\e[4;91m"
_green="\e[4;92m"
_yellow="\e[4;93m"
_cyan="\e[96m"
_nc="\e[0m"
_title=✨
_task="🛠️ "
_lint=🔍
_test=🧪
_build=📦
_done="✔️ "

clear

echo -e "${_title} ${_red}Mɪɴᴅɜʀ BACKEND${_nc} ${_title}\n"

echo -en "${_task} ${_yellow}Installing dependencies${_nc} ... "
uv sync --extra dev --quiet
echo -e "${_cyan}Complete${_nc}\n"

echo -e "${_lint} ${_yellow}Linting${_nc}:\n"
./lint.sh

echo -e "\n${_test} ${_yellow}Testing${_nc}:\n"
./test.sh

echo -e "${_build} ${_yellow}Building${_nc}:\n"
./Dockerfile

echo -e "\n${_done} ${_green}Done${_nc}!\n"
