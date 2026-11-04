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
#include "helpdialog.h"
#include "ui_helpdialog.h"

HelpDialog::HelpDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::HelpDialog)
{
    ui->setupUi(this);
#ifdef MOBILE_VERSION
    this->setWindowState(Qt::WindowMaximized);
#endif

    this->setWindowIcon(QIcon::fromTheme("help-contents",QIcon(":/icons/help-contents")));
}

void HelpDialog::setHelpFile(QString fileName)
{
    QFile file(fileName);
    if (file.open(QIODevice::ReadOnly | QIODevice::Text))
    {
        QString helpText = QString::fromUtf8(file.readAll());
        ui->textBrowser->setHtml(helpText);

        file.close();
    }
}

HelpDialog::~HelpDialog()
{
    delete ui;
}
