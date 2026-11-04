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

#ifndef PHYXUNITSYSTEM_H
#define PHYXUNITSYSTEM_H

#include <QObject>
#include <QStringList>
#include "phyxunit.h"
#include "global.h"

class PhyxUnitSystem : public QObject
{
    Q_OBJECT
public:
    typedef struct PhyxPrefixStruct{
        PhyxFloatDataType value;          /// the value of the prefix
        QString     unitGroup;      /// the unit system of the prefix
        QString     symbol;         /// the symbol of the prefix
        bool        inputOnly;      /// input only flag, when set this prefix is not used for output

        bool operator < (PhyxPrefixStruct prefix) const
        {
            return value < prefix.value;
        }
    } PhyxPrefix;

    typedef QMap<QString, PhyxUnit*> PhyxUnitMap;

    explicit PhyxUnitSystem(QObject *parent = 0);
    ~PhyxUnitSystem();

    void addBaseUnit(QString symbol, PhyxUnit::UnitFlags flags, QString unitGroup, QString preferedPrefix);    ///< adds a base unit
   // void addDerivedUnit(QString symbol,
   //                     PhyxVariable *variable,
   //                     double offset,
   //                     PhyxUnit::UnitFlags flags);                 ///< adds a derived unit, based on a variable
    void addDerivedUnit(PhyxUnit *unit);                            ///< adds a derived unit
    bool removeUnit(QString symbol);                                ///< removes a unit, returns successful
    void addPrefix(QString symbol, PhyxFloatDataType value, QString unitGroup, bool inputOnly = false);///< adds a prefix
    bool removePrefix(QString symbol);                              ///< removes a prefix, returns successful
    void addUnitGroup(QString name);                                ///< adds a unit group
    bool removeUnitGroup(QString name);                             ///< removes a unit group, returns succesful

    PhyxUnit * copyUnit(QString symbol) const;                      ///< copys a unit
    PhyxUnit * unit(QString symbol) const;                          ///< gives back a reference to the unit
    PhyxUnitMap units() const;                                      ///< gives back a map holding all defined units

    PhyxPrefix  prefix(QString symbol, QString unitGroup) const;  ///< returns the value of a prefix
    QList<PhyxPrefix> prefixes(QString unitGroup = QString()) const;            ///< returns all prefixes for one unitGroup sorted

    PhyxUnit * verifyUnit(PhyxUnit *unit) const;                             ///< finds unit in the system and sets all the missing information, return wheter unit was found or not
private:
    PhyxUnitMap    baseUnitsMap;                                    /// contains all base units mapped with their symbol
    PhyxUnitMap    derivedUnitsMap;                                 /// contains all derived units mapped with their symbol
    QMultiMap<QString, PhyxPrefix>   prefixMap;                     /// contains all unit prefixes
    QStringList                 unitGroupsList;                     /// contains all unit groups

    void recalculateUnits();                                        ///< recalculates all units
    void recalculateVariables();                                    ///< recalculates all variables
    void recalculate();                                             ///< recalculates units and variables
signals:
    void unitAdded(QString symbol);
    void unitRemoved(QString symol);
    void prefixAdded(QString symbol);
    void prefixRemoved(QString symbol);
    void unitGroupAdded(QString name);
    void unitGroupRemoved(QString name);

public slots:

};

#endif // PHYXUNITSYSTEM_H
