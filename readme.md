# Infoveave
copy; 2015-2016, Noesys Software Pvt Ltd. 

Dual Licensed under Infoveave Commercial and AGPLv3

You should have received a copy of the GNU Affero General Public License v3
along with this program (Infoveave)
You can be released from the requirements of the license by purchasing
a commercial license. Buying such a license is mandatory as soon as you
develop commercial activities involving the Infoveave without
disclosing the source code of your own applications.


Development
---
- Make Sure `node >4.0` is installed
- Global npm modules [ `typescript`  `tslint`  `gulp`] (`npm install -g`)
- Clone the respositorty
- Run `npm install`
- Run `bower install`
- Run `gulp prebuild`
- Run `npm run develop` to start the development.

## Publish

- Run `npm run release.web` and copy `build`, `assets`, `index.html` to `wwwroot` of core application