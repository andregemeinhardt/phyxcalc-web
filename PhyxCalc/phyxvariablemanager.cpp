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

#include "phyxvariablemanager.h"

PhyxVariableManager::PhyxVariableManager(QObject *parent) :
    QObject(parent)
{
}

void PhyxVariableManager::addVariable(QString name, PhyxVariable *variable)
{
    if (variableMap.contains(name))
        variableMap.value(name)->deleteLater();

    variableMap.insert(name, variable);
    emit variableAdded(name);
}

PhyxVariable *PhyxVariableManager::getVariable(QString name) const
{
    if (variableMap.contains(name))
    {
        PhyxVariable *variable = new PhyxVariable();
        PhyxVariable::copyVariable(variableMap.value(name, NULL), variable);
        return variable;
    }
    else
        return NULL;
}

void PhyxVariableManager::removeVariable(QString name)
{
    if (variableMap.contains(name))
    {
        variableMap.value(name)->deleteLater();
        variableMap.remove(name);
        emit variableRemoved(name);
    }
}

void PhyxVariableManager::renameVariable(QString oldName, QString newName)
{
    if (variableMap.contains(oldName))
    {
        PhyxVariable *variable = variableMap.value(oldName);
        variableMap.remove(oldName);
        variableMap.insert(newName, variable);
        emit variableRemoved(oldName);
        emit variableAdded(newName);
    }
}

bool PhyxVariableManager::containsVariable(QString name) const
{
    return variableMap.contains(name);
}

PhyxVariableManager::PhyxVariableMap *PhyxVariableManager::variables()
{
    return &variableMap;
}

void PhyxVariableManager::addConstant(QString name, PhyxVariable *variable)
{
    if (constantMap.contains(name))
        constantMap.value(name)->deleteLater();

    constantMap.insert(name, variable);
    emit constantAdded(name);
}

PhyxVariable *PhyxVariableManager::getConstant(QString name) const
{
    if (constantMap.contains(name))
    {
        PhyxVariable *variable = new PhyxVariable();
        PhyxVariable::copyVariable(constantMap.value(name, NULL), variable);
        return variable;
    }
    else
        return NULL;
}

void PhyxVariableManager::removeConstant(QString name)
{
    if (constantMap.contains(name))
    {
        constantMap.value(name)->deleteLater();
        constantMap.remove(name);
        emit constantRemoved(name);
    }
}

void PhyxVariableManager::renameConstant(QString oldName, QString newName)
{
    if (constantMap.contains(oldName))
    {
        PhyxVariable *variable = constantMap.value(oldName);
        constantMap.remove(oldName);
        constantMap.insert(newName, variable);
        emit variableRemoved(oldName);
        emit variableAdded(newName);
    }
}

bool PhyxVariableManager::containsConstant(QString name) const
{
    return constantMap.contains(name);
}

PhyxVariableManager::PhyxVariableMap *PhyxVariableManager::constants()
{
    return &constantMap;
}

void PhyxVariableManager::addFunction(QString name, QString expression, QStringList parameters)
{
    if (functionMap.contains(name))
    {
        emit functionRemoved(name, functionMap.value(name)->parameterCount());
        functionMap.remove(name);
    }

    PhyxFunction *function = new PhyxFunction();
    function->expression = expression;
    function->parameters = parameters;
    functionMap.insert(name, function);
    emit functionAdded(name, function->parameterCount());
}

PhyxVariableManager::PhyxFunction * PhyxVariableManager::getFunction(QString name)
{
    if (functionMap.contains(name))
        return functionMap.value(name);
    else
        return NULL;
}

void PhyxVariableManager::removeFunction(QString name)
{
    if (functionMap.contains(name))
    {
        emit functionRemoved(name, functionMap.value(name)->parameterCount());
        functionMap.remove(name);
    }
}

PhyxVariableManager::PhyxFunctionMap *PhyxVariableManager::functions()
{
    return &functionMap;
}

void PhyxVariableManager::addDataset(PhyxVariableManager::PhyxDataset *dataset)
{
    datasetList.append(dataset);
}

PhyxVariableManager::PhyxDataset *PhyxVariableManager::getDataset(int index) const
{
    if (index < datasetList.size())
        return datasetList[index];
    else
        return NULL;
}

void PhyxVariableManager::removeDataset(int index)
{
    PhyxDataset *dataset = datasetList[index];
    for (int i = 0; i < dataset->unit.size(); i++)
        dataset->unit.at(i)->deleteLater();
    datasetList.removeAt(index);
    delete dataset;
}

PhyxVariableManager::PhyxDatasetList *PhyxVariableManager::datasets()
{
    return &datasetList;
}

void PhyxVariableManager::clearVariables()
{
    QMapIterator<QString, PhyxVariable*> i(variableMap);
    while (i.hasNext())
    {
        i.next();
        QString name = i.key();
        PhyxVariable *variable = i.value();

        variableMap.remove(name);
        emit variableRemoved(name);
        variable->deleteLater();
    }
}
