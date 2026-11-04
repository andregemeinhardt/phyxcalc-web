/**************************************************************************
**
** This file is part of PhyxCalc.
**
** PhyxCalc is free software: you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation, either version 3 of the License, or
** (at your option) any later version.
**
** PhyxCalc is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with PhyxCalc.  If not, see <http://www.gnu.org/licenses/>.
**
***************************************************************************/

#ifndef UNITLOADER_H
#define UNITLOADER_H

#include <QObject>
#include <QMap>
#include <QFile>
#include <QTextStream>
#include <QStringList>
#include <QDebug>
#include <cmath>
#include "global.h"

/*struct SIUnit {
    QString measure;
    QStringList symbols;
    QString dimension;
    QString unit;
    QString name;
    double identifier;
};*/

//map index is symbol
/*struct physicalUnit {
    QString quantity;
    QString unit;
    QString formula;
};*/

struct symbolStruct
{
    QString name;
    QString symbol;
};

class UnitLoader : public QObject
{
    Q_OBJECT
public:
    explicit UnitLoader(QObject *parent = 0);

    //QMap<QString, QString> *units() {return &unitMap;}
    QList<symbolStruct>            *symbols() {return &symbolList;}

        //QMap<double, SIUnit>        *siUnits() {return &siUnitMap;}
        //QMap<QString, double>       *siPrefixes() {return &siPrefixMap;}

    bool loadSymbols(QString directory);
private:
    //QMap<QString, QString>     unitMap;
    QList<symbolStruct>                symbolList;

    /* loads physcial units and symbols from local file*/
    //bool loadUnits();
    /* loads replacement table for symbols from local file*/

    //QMap<QString, double>           siPrefixMap;
    //QMap<double, SIUnit>           siBaseUnitMap;
    //QMap<double, SIUnit>           siUnitMap;

    /* initializes si prefixes*/
    //void loadSiPrefixes();
    /* loads SI base units */
    //bool loadSiBaseUnits();
    /* loads SI units */
    //bool loadSiUnits();

signals:

public slots:

};

#endif // UNITLOADER_H
