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

#include "phyxunitsystem.h"

PhyxUnitSystem::PhyxUnitSystem(QObject *parent) :
    QObject(parent)
{
}

PhyxUnitSystem::~PhyxUnitSystem()
{
    // cleanup maps
    QMapIterator<QString, PhyxUnit*> i(baseUnitsMap);
    while (i.hasNext())
    {
        i.next();
        i.value()->deleteLater();
    }
    QMapIterator<QString, PhyxUnit*> i2(derivedUnitsMap);
    while (i2.hasNext())
    {
        i2.next();
        i2.value()->deleteLater();
    }
}

void PhyxUnitSystem::addBaseUnit(QString symbol, PhyxUnit::UnitFlags flags, QString unitGroup, QString preferedPrefix)
{
    if (baseUnitsMap.contains(symbol))
        baseUnitsMap.take(symbol)->deleteLater();

   PhyxUnit *unit = new PhyxUnit();
   unit->setSymbol(symbol);
   unit->powerAppend(preferedPrefix + symbol, PHYX_FLOAT_ONE);
   unit->setFlags(flags);
   unit->setUnitGroup(unitGroup);
   unit->setPreferedPrefix(preferedPrefix);
   baseUnitsMap.insert(symbol, unit);

    if (derivedUnitsMap.contains(symbol))
    {
        derivedUnitsMap.take(symbol)->deleteLater();
        recalculate();
    }

    emit unitAdded(symbol);
}

/*void PhyxUnitSystem::addDerivedUnit(QString symbol, PhyxVariable *variable, double offset, PhyxUnit::UnitFlags flags)
{
    if (baseUnitsMap.contains(symbol))
        delete baseUnitsMap.take(symbol);

    PhyxUnit *unit;

    if (derivedUnitsMap.contains(symbol))
        unit = derivedUnitsMap.value(symbol);
    else
        unit = new PhyxUnit();

   variable->simplifyUnit();
   unit->setSymbol(symbol);
   unit->setPowers(variable->unit()->powers());
   unit->setScaleFactor(variable->value());
   unit->setOffset(offset);
   unit->setFlags(flags);
   derivedUnitsMap.insert(symbol, unit);

   recalculate();
}*/

void PhyxUnitSystem::addDerivedUnit(PhyxUnit *unit)
{
    if (baseUnitsMap.contains(unit->symbol()))
        baseUnitsMap.take(unit->symbol())->deleteLater();

    if (derivedUnitsMap.contains(unit->symbol()))
        derivedUnitsMap.take(unit->symbol())->deleteLater();

   derivedUnitsMap.insert(unit->symbol(), unit);
   recalculate();

   emit unitAdded(unit->symbol());
}

bool PhyxUnitSystem::removeUnit(QString symbol)
{
    if (baseUnitsMap.contains(symbol))
        baseUnitsMap.take(symbol)->deleteLater();

    if (derivedUnitsMap.contains(symbol))
        derivedUnitsMap.take(symbol)->deleteLater();

    recalculate();

    emit unitRemoved(symbol);

    return true;
}

void PhyxUnitSystem::addPrefix(QString symbol, PhyxFloatDataType value, QString unitGroup, bool inputOnly)
{
    PhyxPrefix prefix;
    prefix.value = value;
    prefix.unitGroup = unitGroup;
    prefix.symbol = symbol;
    prefix.inputOnly = inputOnly;

    prefixMap.insert(symbol, prefix);
    emit prefixAdded(symbol);
}

bool PhyxUnitSystem::removePrefix(QString symbol)
{
    prefixMap.remove(symbol);
    emit prefixRemoved(symbol);
    return true;
}

void PhyxUnitSystem::addUnitGroup(QString name)
{
    if (!unitGroupsList.contains(name))
        unitGroupsList.append(name);
    emit unitGroupAdded(name);
}

bool PhyxUnitSystem::removeUnitGroup(QString name)
{
    unitGroupsList.removeOne(name);
    emit unitGroupRemoved(name);
    return true;
}

void PhyxUnitSystem::recalculateUnits()
{
}

void PhyxUnitSystem::recalculateVariables()
{
}

void PhyxUnitSystem::recalculate()
{
    recalculateUnits();
    recalculateVariables();
}

PhyxUnit * PhyxUnitSystem::copyUnit(QString symbol) const
{
    if (baseUnitsMap.contains(symbol))
    {
        PhyxUnit *unit = new PhyxUnit();
        PhyxUnit::copyUnit(baseUnitsMap.value(symbol), unit);
        return unit;
    }
    else if (derivedUnitsMap.contains(symbol))
    {
        PhyxUnit *unit = new PhyxUnit();
        PhyxUnit::copyUnit(derivedUnitsMap.value(symbol), unit);
        return unit;
    }
    else
        return new PhyxUnit();
}

PhyxUnit *PhyxUnitSystem::unit(QString symbol) const
{
    if (baseUnitsMap.contains(symbol))
        return baseUnitsMap.value(symbol);
    else if (derivedUnitsMap.contains(symbol))
        return derivedUnitsMap.value(symbol);
    else
        return new PhyxUnit();
}

PhyxUnitSystem::PhyxUnitMap PhyxUnitSystem::units() const
{
    PhyxUnitMap map;

    QMapIterator<QString, PhyxUnit*> mapIterator1(baseUnitsMap);
    while (mapIterator1.hasNext())
    {
        mapIterator1.next();
        map.insert(mapIterator1.key(), mapIterator1.value());
    }
    QMapIterator<QString, PhyxUnit*> mapIterator2(derivedUnitsMap);
    while (mapIterator2.hasNext())
    {
        mapIterator2.next();
        map.insert(mapIterator2.key(), mapIterator2.value());
    }

    return map;
}

PhyxUnitSystem::PhyxPrefix PhyxUnitSystem::prefix(QString symbol, QString unitGroup) const
{
    PhyxPrefix prefix;
    prefix.value = 1;
    prefix.unitGroup = "";

    QList<PhyxPrefix> prefixList = prefixMap.values(symbol);
    for (int i = 0; i < prefixList.size(); i++)
    {
        if (prefixList.at(i).unitGroup == unitGroup)
            return prefixList.at(i);
    }
    return prefix;
}

QList<PhyxUnitSystem::PhyxPrefix> PhyxUnitSystem::prefixes(QString unitGroup) const
{
    QList<PhyxPrefix> prefixes;

    QMapIterator<QString, PhyxPrefix> mapIterator(prefixMap);
    while (mapIterator.hasNext())
    {
        mapIterator.next();
        if ((mapIterator.value().unitGroup == unitGroup) || (unitGroup.isEmpty()))
            prefixes.append(mapIterator.value());
    }

    //append the empty 1 prefix
    PhyxPrefix onePrefix;
    onePrefix.unitGroup = unitGroup;
    onePrefix.value = 1;
    onePrefix.symbol = "";
    onePrefix.inputOnly = false;
    prefixes.append(onePrefix);

    qSort(prefixes.begin(), prefixes.end());    // sort the prefixes
    return prefixes;
}

PhyxUnit *PhyxUnitSystem::verifyUnit(PhyxUnit *unit) const
{
    if (unit->isBaseUnit())
    {
        QMapIterator<QString, PhyxUnit*> i(baseUnitsMap);
        while (i.hasNext())
        {
            i.next();
            if (i.value()->isSame(unit))
            {
                //PhyxUnit::copyUnit(i.value(), unit);
               // unit->deleteLater();
                //unit = i.value();
                return i.value();
                //return true;
            }
        }
    }
    else
    {
        QList<PhyxUnit*> matchList;
        QMapIterator<QString, PhyxUnit*> i(derivedUnitsMap);
        while (i.hasNext())
        {
            i.next();
            if (i.value()->isSame(unit))
                matchList.append(i.value());
        }

        if (!matchList.isEmpty())
        {
            PhyxUnit* match = NULL;
            if (matchList.size() > 1)   //handle multiple matches, currently the first match with unitGroup is used
            {
                for (int pos = 0; pos < matchList.size(); pos++)
                {
                    if (!matchList.at(pos)->unitGroup().isEmpty())
                    {
                        match = matchList[pos];
                        break;
                    }
                }
                if (match == NULL)
                    match = matchList.first();
            }
            else
                match = matchList.first();

            //PhyxUnit::copyUnit(match, unit);
            //unit->deleteLater();
            //unit = match;
            return match;
            //return true;
        }
    }

    return NULL;
    //return false;
}
