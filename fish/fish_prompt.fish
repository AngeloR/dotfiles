function fish_prompt
  set_color red -o
  set_color cyan -o
  if test $PWD = $HOME
    echo -n "~"
  else
    echo -n $PWD
  end
  if git status >/dev/null ^/dev/null
    set_color red -o
    echo -n " ["
    echo -n (git branch | grep '*' | cut -c3-)
    echo -n " "
    if not test (git status | tail -1) = "nothing to commit, working directory clean"
      set_color yellow -o
      echo -n "×"
    end
    set_color red -o
    echo -n "]"
  end
  echo -n " "
  echo -n "> "
end
