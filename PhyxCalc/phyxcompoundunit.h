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

#ifndef PHYXCOMPOUNDUNIT_H
#define PHYXCOMPOUNDUNIT_H

#include "phyxunit.h"
#include "phyxunitsystem.h"
#include "cmath"

class PhyxUnitSystem;

class PhyxCompoundUnit : public PhyxUnit
{
    Q_OBJECT
    Q_PROPERTY(PhyxUnitSystem *unitSystem READ unitSystem WRITE setUnitSystem)
    Q_PROPERTY(PhyxCompoundList compounds READ compounds WRITE setCompounds)

public:

    /// a compound of the compound unit
    typedef struct CompoundStruct{
        PhyxUnit                *unit;  /// the unit of the compound
        PhyxFloatDataType       power;  /// the power of the compound

        bool operator == (CompoundStruct compound){
            return (unit->isSame(compound.unit) && (power == compound.power));
        }
        void operator = (CompoundStruct compound){
            PhyxUnit::copyUnit(compound.unit, this->unit);
            this->power = compound.power;
        }
    } PhyxCompound;
    typedef QList<PhyxCompound>     PhyxCompoundList;
    explicit PhyxCompoundUnit(QObject *parent = 0);
    ~PhyxCompoundUnit();

    void compoundSimplify(int index);                   ///< simplifies a unit
    void compoundsEqualize(PhyxCompoundUnit *unit);     ///< equalizes two units

    bool isSame(PhyxCompoundUnit *unit);                ///< returns wheter this unit is the same as the given unit or not
    bool isConvertible(PhyxCompoundUnit *unit);         ///< returns wheter this unit is convertible to the given unit or not
    bool isOne();                                       ///< returns wheter the unit is one
    bool isSimpleUnit();                                ///< returns wheter this unit contains only one unit or not

    /// functions for unit manipulation
    bool add(PhyxCompoundUnit *unit);
    bool sub(PhyxCompoundUnit *unit);
    void multiply(PhyxCompoundUnit *unit);
    void divide(PhyxCompoundUnit *unit);
    void raise(PhyxFloatDataType power);
    void root(PhyxFloatDataType root);

    bool convertTo(PhyxCompoundUnit *unit);             ///< converts the variable to the given unit, returns successful
    void fromSimpleUnit(PhyxUnit *unit);                ///< make a compound unit from a simple unit

    void simplify();                                    ///< simplifies the unit (e.g.: GalileanUnit -> ProductUnit, DimensionlessUnit -> NoUnit)

    static void copyCompoundUnit(PhyxCompoundUnit *source, PhyxCompoundUnit *destination);

    QString const symbol();
    QString const preferedPrefix();                     ///< this overloaded function returns the prefered prefix if unit is a simple unit
    QString const unitGroup();                          ///< this overloaded function returns the unit group of the unit if the unit is a simple unit

    PhyxUnitSystem * unitSystem() const
{
    return m_unitSystem;
}
    PhyxCompoundList compounds() const
{
    return m_compounds;
}

private:
    PhyxUnitSystem * m_unitSystem;

    PhyxCompoundList  m_compounds;    /// holds all compounds of a unit: e.g.: m/s -> compuound 1: m^1, compound 2: s^-1
    void compoundAppend(PhyxUnit *unit, PhyxFloatDataType power);       ///< adds a power to the map
    void compoundMultiply(PhyxUnit *unit, PhyxFloatDataType factor);    ///< multiplies a power with factor
    void compoundDivide(PhyxUnit *unit, PhyxFloatDataType factor);      ///< devides a power with factor
    void compoundEqualize(int unitIndex, PhyxCompoundUnit *parentUnit); ///< equalizes one compound with the matching compound in the given unit
    void compoundStrip(int index);                                      ///< splits an compound into its powers
    void compoundsMultiply(PhyxCompoundList compounds);                 ///< multiplies powers of the unit with other powers
    void compoundsDivide(PhyxCompoundList compounds);                   ///< devides powers of the unit with other powers
    void compoundsRaise(PhyxFloatDataType power);                       ///< raises all powers to power
    void compoundsRoot(PhyxFloatDataType root);                         ///< takes the root of all powers
    void compoundsClear();                                              ///< clear all compounds
    void compoundsSetNull();                                            ///< sets the powers of all compounds to 0
    int  compoundsNonNullCount();                                       ///< returns the number of compounds that are not 0
    bool compoundsCompare(PhyxCompoundList const compounds);                  ///< compares other compounds with the compounds of this unit
    //static PhyxCompoundList const copyCompounds(PhyxCompoundUnit *sourceUnit);   ///< copies the compounds
    void verify();                                                      ///< searches for the unit in the unit system

signals:
    void offsetValue(PhyxFloatDataType value);                         ///< offsets the value of the variable
    void scaleValue(PhyxFloatDataType scaleFactor);                    ///< scales the value of the variable
    
public slots:

void setUnitSystem(PhyxUnitSystem * arg)
{
    m_unitSystem = arg;
}
void setCompounds(PhyxCompoundList arg)
{
    m_compounds = arg;
}
};

#endif // PHYXCOMPOUNDUNIT_H
