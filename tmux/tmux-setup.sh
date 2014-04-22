git clone https://github.com/seebi/tmux-colors-solarized
cd tmux-colors-solarized
cat tmuxcolors-dark.conf >> ../.tmux.conf
cd ~
ln -s ~/personal/dotfiles/tmux/.tmux.conf .
