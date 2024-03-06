## Initial Setup (If you have never deployed before)

- [ ] Sign in to heroku and ensure you have access to the as-bugzy heroku instance. If you do not, [file a request][new-issue] for access.
- [ ] Ensure if you have the heroku cli installed (`heroku --version`) and you are authenticated. If you do not, [follow these instructions][heroku-instructions]
- [ ] In the root of your local bugzy repository, add heroku as a remote with `heroku git:remote -a as-bugzy`

## Deploying to production

- [ ] Ensure you are on the `main` branch, it is up-to-date, and that you don't have an `npm start` process currently running.
- [ ] Run `npm run deploy`. Ensure you are now on a new `deploy` branch, and build assets have been force added. Check by running `git status`
- [ ] Manually test the production environment by running `npm run start_prod` and clicking around to several pages.
- [ ] If everything is working as expected, create a deploy commit. Note that this commit will only be pushed to heroku's repository. For example: `git commit -a -m "deploy commit"`
- [ ] Force push to heroku with `git push heroku deploy:main -f`, where `heroku` is the name of your heroku remote.
- [ ] When you terminal indicates the deploy has finished, check [www.bugzy.org][] to ensure everything is working

## If a deploy fails / a major bug has broken production

- [ ] The easiest and quickest way to handle this is with a rollback. You can do this by (a) running `heroku rollback` from the terminal to rollback to the previous version, or (b) checking the last known working version in the "Activity" section of the heroku dashboard and either clicking "Roll back to here" in the interface, or running `heroku rollback v42` where `42` is the number of the last working version.

[heroku-instructions]: https://devcenter.heroku.com/articles/heroku-cli
[new-issue]: https://github.com/mozilla/bugzy/issues/new/choose
[www.bugzy.org]: https://www.bugzy.org
