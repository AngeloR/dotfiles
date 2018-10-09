execute pathogen#infect()

"NERDTree
autocmd vimenter * if !argc() | NERDTree | endif
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTreeType") && b:NERDTreeType == "primary") | q | endif
let g:NERDTreeDirArrows=0

"NERDTreeTabs
map nnt :NERDTreeTabsToggle<Enter>

"ctrlp - for fuzzy search
set runtimepath^=~/.vim/bundle/ctrlp/ctrlp.vim

"functionality
set hlsearch
set ignorecase
set smartcase
set laststatus=2
set number
set swapfile
set dir=~/tmp
set colorcolumn=80
set t_Co=256
let g:solarized_termcolors=256
set background=dark

"code display
set tabstop=4
set shiftwidth=4
set expandtab
set ruler
set autoindent
syntax on
filetype plugin indent on

"shortcuts
cnoreabbrev <expr> W ((getcmdtype() is# ':' && getcmdline() is# 'W')?('w'):('W'))
cnoreabbrev <expr> Q ((getcmdtype() is# ':' && getcmdline() is# 'Q')?('q'):('Q'))

"gvim nonsense
:set guioptions-=m "remove menubar
:set guioptions-=T "remove toolbar
:set guioptions-=r "remove right scrollbar
:set guioptions-=L "remove left scrollbar

"remap esc
inoremap jj <ESC>
