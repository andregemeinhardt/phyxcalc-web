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

#include "phyxunit.h"

PhyxUnit::PhyxUnit(QObject *parent) :
    QObject(parent)
{
    m_symbol = "";
    m_name   = "";
    m_unitGroup = "";
    m_preferedPrefix = "";
    m_offset = PHYX_FLOAT_NULL;
    m_scaleFactor = PHYX_FLOAT_ONE;
    m_flags = 0;
    m_powers = new PowerMap();
}

PhyxUnit::~PhyxUnit()
{
    delete m_powers;
}

void PhyxUnit::powerAppend(QString base, PhyxFloatDataType power)
{
    m_powers->insert(base, power);
}

void PhyxUnit::powerMultiply(QString base, PhyxFloatDataType factor)
{
    PhyxFloatDataType power;
    if (m_powers->contains(base))
    {
        power = m_powers->value(base);
        power += factor;
    }
    else
    {
        power = factor;
    }

    if (power == PHYX_FLOAT_NULL)
        m_powers->remove(base);
    else
        m_powers->insert(base, power);
}

void PhyxUnit::powerDivide(QString base, PhyxFloatDataType factor)
{
    /*PhyxFloatDataType power;
    if (m_powers->contains(base))
    {
        power = m_powers->value(base);
        power -= factor;
    }
    else
    {
        power = -factor;
    }

    if (power == PHYX_FLOAT_NULL)
        m_powers->remove(base);
    else
        m_powers->insert(base, power);*/
    powerMultiply(base, -factor);
}

void PhyxUnit::powersMultiply(PhyxUnit::PowerMap *powers)
{
    QMapIterator<QString, PhyxFloatDataType> i(*powers);
     while (i.hasNext()) {
         i.next();
         powerMultiply(i.key(), i.value());
     }
}

void PhyxUnit::powersDivide(PowerMap *powers)
{
    QMapIterator<QString, PhyxFloatDataType> i(*powers);
     while (i.hasNext()) {
         i.next();
         powerDivide(i.key(), i.value());
     }
}

void PhyxUnit::powersRaise(PhyxFloatDataType power)
{
    QMapIterator<QString, PhyxFloatDataType> i(*m_powers);
     while (i.hasNext()) {
         i.next();
         m_powers->insert(i.key(), i.value() * power);
     }
}

void PhyxUnit::powersRoot(PhyxFloatDataType root)
{
    QMapIterator<QString, PhyxFloatDataType> i(*m_powers);
     while (i.hasNext()) {
         i.next();
         m_powers->insert(i.key(), i.value() / root);
     }
}

bool PhyxUnit::powersCompare(PhyxUnit::PowerMap *powers)
{
    return *m_powers == *powers;
}

void PhyxUnit::powersClear()
{
    m_powers->clear();
}

bool PhyxUnit::isOne()
{
    return ((m_scaleFactor == PHYX_FLOAT_ONE) && (m_offset == PHYX_FLOAT_NULL) && (m_powers->isEmpty()));
}

bool PhyxUnit::isBaseUnit()
{
    if (((m_scaleFactor == PHYX_FLOAT_ONE) && (m_offset == PHYX_FLOAT_NULL) && (m_powers->size() == 1)))
    {
        QMapIterator<QString, PhyxFloatDataType> i(*m_powers);
        i.next();
        if (i.value() == PHYX_FLOAT_ONE)
            return true;
        else
            return false;
    }
    else
        return false;
}

bool PhyxUnit::isDimensionlessUnit()
{
    return ((m_offset == PHYX_FLOAT_NULL) && (m_powers->isEmpty()));
}

bool PhyxUnit::isProductUnit()
{
    return ((m_scaleFactor == PHYX_FLOAT_ONE) && (m_offset == PHYX_FLOAT_NULL) && (m_powers->size() >= 1));
}

bool PhyxUnit::isGalileanUnit()
{
    return (((m_scaleFactor != PHYX_FLOAT_ONE) || (m_offset != PHYX_FLOAT_NULL)) && (m_powers->size() >= 1));
}

bool PhyxUnit::isConvertible(PhyxUnit *unit)
{
    return powersCompare(unit->powers());
}

bool PhyxUnit::isSame(PhyxUnit *unit)
{
    if (this->offset() != unit->offset())
        return false;
    if (this->scaleFactor() != unit->scaleFactor())
        return false;
    return powersCompare(unit->powers());
}

void PhyxUnit::copyUnit(PhyxUnit *source, PhyxUnit *destination)
{
    destination->setPowers(source->powers());
    destination->setSymbol(source->symbol());
    destination->setOffset(source->offset());
    destination->setScaleFactor(source->scaleFactor());
    destination->setFlags(source->flags());
    destination->setPreferedPrefix(source->preferedPrefix());
    destination->setUnitGroup(source->unitGroup());
}

QString PhyxUnit::dimensionString() const       //this can't handle units with prefered prefix
{
    QString outputString;
    QMapIterator<QString, PhyxFloatDataType> i(*m_powers);
    while (i.hasNext())
    {
        i.next();
        if (!outputString.isEmpty())
            outputString.append('*');
        outputString.append(QString("%1%2").arg(i.key()).arg(static_cast<double>(i.value())));
    }

    // unicodify string
    outputString.replace(QChar('*'), QChar(0x22C5)); //mathematic dot operator
    outputString.replace(QChar('0'), QChar(0x2070));
    outputString.replace(QChar('1'), QChar(0x00B9));
    outputString.replace(QChar('2'), QChar(0x00B2));
    outputString.replace(QChar('3'), QChar(0x00B3));
    outputString.replace(QChar('4'), QChar(0x2074));
    outputString.replace(QChar('5'), QChar(0x2075));
    outputString.replace(QChar('6'), QChar(0x2076));
    outputString.replace(QChar('7'), QChar(0x2077));
    outputString.replace(QChar('8'), QChar(0x2078));
    outputString.replace(QChar('9'), QChar(0x2079));
    outputString.replace(QChar('-'), QChar(0x207B));
    return outputString;
}

/*void PhyxUnit::prefixMultiply(double factor)
{
    m_prefixPower += factor;
}

void PhyxUnit::prefixDevide(double factor)
{
    m_prefixPower -= factor;
}

void PhyxUnit::prefixRaise(double power)
{
    m_prefixPower *= power;
}

void PhyxUnit::prefixRoot(double root)
{
    m_prefixPower /= root;
}*/
