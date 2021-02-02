/*
* Copyright (c) 2018 ALSENET SA
*
* Author(s):
*
*      Luc Deschenaux <luc.deschenaux@freesurf.ch>
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*/
'use strict';

var _parse = require('mrz').parse;

module.exports = {
  parse: parse
};

var _mrz;
var result;

function _relax(_r) {
  let _retry = false;
  result.details.forEach(function (d) {
    // relax only if detail is invalid or within range
    if (!d.valid || (_r && d.line == _r.line && d.start >= _r.start && d.end <= _r.end)) {
      if (d.label.search(/date|digit|number/i) >= 0) {
        let v0 = _mrz[d.line].substr(d.start, d.end - d.start);
        let v = v0.replace(/O/gi, '0');
        v = v.replace(/l|I/g, '1');
        v = v.replace(/S/gi, '5');
        v = v.replace(/g/, '9');
        v = v.replace(/B/, '8');
        if (v != v0) {
          _mrz[d.line] = _mrz[d.line].substr(0, d.start) + v + _mrz[d.line].substr(d.end);
          _retry = true;
        }
        // relax ranges for check digits
        if (!_r && d.label.search(/digit/i) >= 0) {
          d.ranges.forEach(function (r) {
            if (!(r.line == d.line && r.start == d.start && r.end == d.end)) {
              _retry = _relax(r) ? true : _retry;
            }
          });
        }
      } else if (d.label.search(/name|state|Nation/i) >= 0) {
        let v0 = _mrz[d.line].substr(d.start, d.end - d.start);
        let v = v0.replace(/0/g, 'O');
        v = v.replace(/1/g, 'I');
        v = v.replace(/5/g, 'S');
        v = v.replace(/8/g, 'B');
        if (v != v0) {
          _mrz[d.line] = _mrz[d.line].substr(0, d.start) + v + _mrz[d.line].substr(d.end);
          _retry = true;
        }
      }
    }
  });
  return _retry;
}

function parse(mrz, modified) {
  _mrz = mrz.slice(0);
  result = _parse(_mrz);
  var retry = _relax();

  if (retry) {
    return parse(_mrz, true);
  } else {
    if (modified) {
      result.modified = _mrz;
    }
    return result;
  }
}
