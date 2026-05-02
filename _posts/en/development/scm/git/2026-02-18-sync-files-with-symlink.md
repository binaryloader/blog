---
date: 2026-02-18T14:00+09:00
title: "[Git] Syncing Configuration Files with Git Using Symbolic Links"
ref: sync-files-with-symlink
lang: en
excerpt: "How to version-control configuration files in a Git repository using symbolic links."
last_modified_at: 2026-02-18T14:00+09:00
published: true
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/sync-files-with-symlink.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/sync-files-with-symlink.png"
categories:
  - Development
  - SCM
  - Git
tags:
  - Git
  - Symbolic Link
  - dotfiles
depth:
  - title: "Development"
    url: /en/development/
  - title: "SCM"
    url: /en/development/scm/
  - title: "Git"
    url: /en/development/scm/git/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# Overview

How to version-control configuration files in a Git repository using symbolic links.

# Steps

## 1. What Is a Symbolic Link

A symbolic link (symlink) is a special file that points to another file or directory. Similar to a shortcut on Windows, the actual data exists only at the original location while the symlink stores just the path information.

The difference from a hard link is as follows.

- Symbolic link: References the path of the original file. If the original is deleted, the link breaks (dangling link).
- Hard link: Shares the inode of the original file. Data remains accessible even if the original is deleted.

Symbolic links are well-suited for syncing configuration files because the original location is clear and it's easy to see which file a link points to.

## 2. Creating a Symbolic Link

Use the `ln -s` command to create a symbolic link.

```zsh
ln -s <source path> <link path>
```

For example, to access `~/Documents/memo.txt` from the desktop:

```zsh
ln -s ~/Documents/memo.txt ~/Desktop/memo.txt
```

Verify that the link was created successfully.

```zsh
ls -la ~/Desktop/memo.txt
# lrwxr-xr-x  1 user  staff  25 Feb 18 14:00 memo.txt -> /Users/user/Documents/memo.txt
```

The `l` file type prefix and `->` arrow confirm it is a symbolic link.

## 3. Syncing with a Git Repository

Sometimes configuration files must reside at specific system paths but you also want to version-control them with Git. Dotfiles like `~/.zshrc`, `~/.gitconfig`, and `~/.ssh/config` are typical examples. Move the originals into a Git repository and create symbolic links at their original locations.

### 3.1. Move the Original to the Repository

```zsh
mv ~/.zshrc ~/repos/dotfiles/.zshrc
```

### 3.2. Create a Symbolic Link

```zsh
ln -s ~/repos/dotfiles/.zshrc ~/.zshrc
```

Now editing `~/.zshrc` actually modifies the file in the repository. Commit and push from the repository to track changes.

### 3.3. Same Pattern for Other Dotfiles

```zsh
# Move originals to the repository
mv ~/.gitconfig ~/repos/dotfiles/.gitconfig
mv ~/.ssh/config ~/repos/dotfiles/.ssh/config

# Create symbolic links
ln -s ~/repos/dotfiles/.gitconfig ~/.gitconfig
ln -s ~/repos/dotfiles/.ssh/config ~/.ssh/config
```

## 4. Removing the Sync

Delete the symbolic link and restore the original file to its previous location.

```zsh
# Delete the symbolic link (original is unaffected)
rm ~/.zshrc

# Restore the original
mv ~/repos/dotfiles/.zshrc ~/.zshrc
```

`rm` only deletes the symbolic link file and does not affect the original.

## 5. Things to Keep in Mind

### Absolute vs. Relative Paths

It is safer to use an absolute path for the source when creating a symlink. Relative paths are resolved from the link's location, so moving the link can break it.

```zsh
# Absolute path (recommended)
ln -s /Users/user/repos/dotfiles/.zshrc ~/.zshrc

# Relative path (resolved from link location)
ln -s ../repos/dotfiles/.zshrc ~/.zshrc
```

### Broken Links When the Original Is Deleted

Deleting the original file breaks the symbolic link. Accessing a broken link results in a "No such file or directory" error. You can find broken links with the following command.

```zsh
find ~ -maxdepth 3 -type l ! -exec test -e {} \; -print
```

### How Git Tracks Symbolic Links

Git tracks the symbolic link itself. When you commit a symlink to a repository, Git stores the path it points to. Cloning the repository on another machine will produce a broken link if the target doesn't exist at that path. Therefore, it is common to keep the original files inside the repository and place symbolic links at system paths outside the repository.

# References

- <https://dotfiles.github.io/>
- <https://man7.org/linux/man-pages/man1/ln.1.html>
