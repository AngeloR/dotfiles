execute pathogen#infect()

"NERDTree
autocmd vimenter * NERDTree
autocmd vimenter * if !argc() | NERDTree | endif
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTreeType") && b:NERDTreeType == "primary") | q | endif

"functionality
set hlsearch
set ignorecase
set smartcase
set laststatus=2
set number
set swapfile
set dir=~/tmp

"code display
set tabstop=4
set shiftwidth=4
set expandtab
set ruler
set autoindent
syntax on
filetype plugin indent on
