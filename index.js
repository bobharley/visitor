/*
  Copyright 2018 https://github.com/bobharley/. All rights reserved

  Licensed under the Apache License, Version 2.0 (the "License")
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*
  I know, this is sloppy coding. But it works.
*/

const {app, BrowserWindow} = require('electron')
const path                 = require('path')

const data = require('./data.json')
let win
let contents
let ses
let proxyCounter = 0
let urlCounter = 0

const uas = data.ua
const proxies = data.proxies.socks
const httpReferrer = data.referrers
const urls = data.urls
const WAIT = 5000
const TIMEOUT = 30000
const createWindow = () => {
  win = new BrowserWindow({width: 800, height: 600})
  contents = win.webContents
  ses = contents.session

  visit(urls[urlCounter], proxies[proxyCounter])
  
  contents.addListener('did-finish-load', () => {
    let title = contents.getTitle()
    setTimeout(() => {
      urlCounter++
      if (urlCounter > urls.length - 1) {
        urlCounter = 0
        proxyCounter++
      }
      if (proxyCounter >= proxies.length) {
        app.quit()
      }
      visit(urls[urlCounter], proxies[proxyCounter])
    },WAIT)
  })

  win.on('closed', () => {
    win = null
  })
}

let resetter

function visit(url, proxy) {
  clearTimeout(resetter)
  ses.clearStorageData([], function () {
    console.log('storage cleared')
    ses.clearCache(() => {
      console.log('cache cleared')
      ses.setProxy({proxyRules: `socks5://${proxy}`}, () => {
        console.log(`Visiting: ${url}`)
        console.log(`Using proxy: ${proxy}`)
        win.loadURL(url, {
          httpReferrer,
          userAgent: uas[Math.floor(Math.random() * uas.length-1)]
        })
        resetter = setTimeout(() => {
          urlCounter++
          if (urlCounter > urls.length - 1) {
            urlCounter = 0
          }
          else {
            proxyCounter++
          }
          if (proxyCounter >= proxies.length) {
            app.quit()
          }
          visit(urls[urlCounter], proxies[proxyCounter])
        }, TIMEOUT)
      })
    })
  })
}

app.on('ready', () => {
  if (urls.length > 0) {
    if (proxies.length > 0) {
      createWindow()
    }
    else {
      console.log('no proxies\nexiting')
      app.quit()
    }
  }
  else {
    console.log('no urls\nexiting')
    app.quit()
  }  
})

app.on('window-all-closed', () => {
  process.platform !== 'darwin' && app.quit()
})

app.on('activate', () => {
  win === null && createWindow()
})