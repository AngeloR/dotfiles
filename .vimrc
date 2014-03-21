execute pathogen#infect()

"NERDTree
autocmd vimenter * NERDTree
autocmd vimenter * if !argc() | NERDTree | endif
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTreeType") && b:NERDTreeType == "primary") | q | endif

"NERDTreeTabs
map nt :NERDTreeTabsToggle<Enter>

"autotag
:so ~/.vim/bundle/AutoTag/plugin/autotag.vim

"TagBar
nmap <F8> :TagbarToggle<CR>

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

"code display
set tabstop=4
set shiftwidth=4
set expandtab
set ruler
set autoindent
syntax on
filetype plugin indent on
color desert

"shortcuts
cnoreabbrev <expr> W ((getcmdtype() is# ':' && getcmdline() is# 'W')?('w'):('W'))
cnoreabbrev <expr> Q ((getcmdtype() is# ':' && getcmdline() is# 'Q')?('Q'):('Q'))

"gvim nonsense
:set guioptions-=m "remove menubar
:set guioptions-=T "remove toolbar
:set guioptions-=r "remove right scrollbar
:set guioptions-=L "remove left scrollbar
