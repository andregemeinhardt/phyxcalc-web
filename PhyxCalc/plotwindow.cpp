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
#include "plotwindow.h"
#include "ui_plotwindow.h"

PlotWindow::PlotWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::PlotWindow)
{
    ui->setupUi(this);
    m_datasets = NULL;

    initializeGUI();

#if QT_VERSION < 0x050000
    ui->qwtPlot->canvas()->setFrameStyle(QFrame::NoFrame);
#endif
    ui->qwtPlot->setStyleSheet("QwtPlot { padding: 5px }"); //this is no fix at all

    plotGrid = new QwtPlotGrid();
    plotGrid->setPen(QPen(Qt::lightGray));
    plotGrid->attach(ui->qwtPlot);

    plotZoomer = new QwtPlotZoomer(ui->qwtPlot->canvas());
    plotZoomer->setTrackerMode(QwtPicker::AlwaysOn);

    QwtPlotPicker *plotPicker = new QwtPlotPicker(ui->qwtPlot->canvas());
    plotPicker->setRubberBand(QwtPlotPicker::CrossRubberBand);
    plotPicker->setTrackerMode(QwtPicker::AlwaysOff);
    plotPicker->setStateMachine(new QwtPickerDragPointMachine());
    plotPicker->setRubberBandPen(QColor(Qt::black));
    plotPicker->setRubberBand(QwtPicker::CrossRubberBand);
    plotPicker->setTrackerPen(QColor(Qt::black));

    //initialize marker
    QwtPlotMarker *plotMarker = new QwtPlotMarker();
    plotMarker->attach(ui->qwtPlot);
    plotMarkers.append(plotMarker);
    updateMarkers();

    setButtonColor(ui->colorBackgroundButton,Qt::white);
    setButtonColor(ui->colorPlotBackgroundButton, Qt::white);
    setButtonColor(ui->colorAxisTicksButton,Qt::black);
    setButtonColor(ui->colorAxisFontButton,Qt::black);
    setButtonColor(ui->colorGridButton,QColor("#c3c3c3"));
    setButtonColor(ui->colorGridMinButton, QColor("#dcdcdc"));
    setButtonColor(ui->colorMarkerLineButton, QColor(0,0,0));
    setButtonColor(ui->colorMarkerSymbolButton, QColor(0,0,0));

    updatePixels();

    updateSettings();

    connect(ui->saveButton, SIGNAL(clicked()),
            this, SLOT(saveDocument()));
    connect(ui->printButton, SIGNAL(clicked()),
            this, SLOT(printPlot()));
    connect(ui->clipboardButton, SIGNAL(clicked()),
            this, SLOT(copyToClipboard()));

    connect(ui->datasetTable, SIGNAL(itemSelectionChanged()),
            this, SLOT(updatePlots()));

    connect(ui->settingsLegendGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsTitleGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBTitleGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTTitleGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLTitleGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRTitleGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsGridGroup, SIGNAL(clicked(bool)),
            this, SLOT(updateSettings()));
    connect(ui->settingsGridXCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsGridYCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsGridXMinCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsGridYMinCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsLineThicknessSpin, SIGNAL(valueChanged(int)),
            this, SLOT(updateSettings()));
    connect(ui->settingsTitleEdit, SIGNAL(textChanged(QString)),
            this, SLOT(updateSettings()));
    connect(ui->settingsLegendPositionCombo, SIGNAL(currentIndexChanged(int)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBTitleEdit, SIGNAL(textChanged(QString)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTTitleEdit, SIGNAL(textChanged(QString)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLTitleEdit, SIGNAL(textChanged(QString)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRTitleEdit, SIGNAL(textChanged(QString)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBAutoscaleCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTAutoscaleCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLAutoscaleCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRAutoscaleCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBScaleMinSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBScaleMaxSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBScaleStepSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTScaleMinSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTScaleMaxSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTScaleStepSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLScaleMinSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLScaleMaxSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLScaleStepSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRScaleMinSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRScaleMaxSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRScaleStepSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBLogCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTLogCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLLogCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRLogCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsXBInvCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsXTInvCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsYLInvCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));
    connect(ui->settingsYRInvCheck, SIGNAL(clicked()),
            this, SLOT(updateSettings()));

    connect(ui->exportWidthSpin, SIGNAL(editingFinished()),
            this, SLOT(updateMMs()));
    connect(ui->exportHeightSpin, SIGNAL(editingFinished()),
            this, SLOT(updateMMs()));
    connect(ui->exportDpiXSpin, SIGNAL(editingFinished()),
            this, SLOT(updateMMs()));
    connect(ui->exportDpiYSpin, SIGNAL(editingFinished()),
            this, SLOT(updateMMs()));
    connect(ui->exportWidthMMSpin, SIGNAL(editingFinished()),
            this, SLOT(updatePixels()));
    connect(ui->exportHeightMMSpin, SIGNAL(editingFinished()),
            this, SLOT(updatePixels()));

    connect(ui->marker1Group, SIGNAL(toggled(bool)),
            this, SLOT(updateMarkers()));
    connect(ui->marker1XSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateMarkers()));
    connect(ui->marker1YSpin, SIGNAL(valueChanged(double)),
            this, SLOT(updateMarkers()));
    connect(ui->marker1LineCombo, SIGNAL(currentIndexChanged(int)),
            this, SLOT(updateMarkers()));
    connect(ui->marker1SymbolCombo, SIGNAL(currentIndexChanged(int)),
            this, SLOT(updateMarkers()));
    connect(ui->marker1SymbolSizeSpin, SIGNAL(valueChanged(int)),
            this, SLOT(updateMarkers()));

    connect(ui->datasetTable,SIGNAL(cellChanged(int,int)),
            this, SLOT(renameDataSet(int,int)));

    //initialize signalmapper
    deleteSignalMapper = new QSignalMapper(this);
    connect(deleteSignalMapper,SIGNAL(mapped(int)),
            this, SLOT(deleteDataset(int)));
}

PlotWindow::~PlotWindow()
{
    delete ui;
}

void PlotWindow::closeEvent(QCloseEvent *event)
{
    event->accept();
    emit visibilityChanged(false);
}

void PlotWindow::showEvent(QShowEvent *event)
{
    event->accept();
    emit visibilityChanged(true);
}

void PlotWindow::initializeGUI()
{
    ui->printButton->setIcon(QIcon::fromTheme("document-print",QIcon(":/icons/document-print")));
    ui->saveButton->setIcon(QIcon::fromTheme("document-save",QIcon(":/icons/document-save")));
    ui->clipboardButton->setIcon(QIcon::fromTheme("edit-copy",QIcon(":/icons/edit-copy")));

#ifdef MOBILE_VERSION
    this->setWindowState(Qt::WindowMaximized);

    ui->tabWidget->hide();
    ui->mobileSettingsButton->setChecked(false);

    ui->mobileCloseButton->setIcon(QIcon::fromTheme("dialog-close",QIcon(":/icons/dialog-close")));
    ui->mobileSettingsButton->setIcon(QIcon::fromTheme("configure",QIcon(":/icons/configure")));

    connect(ui->mobileCloseButton, SIGNAL(clicked()),
            this, SLOT(close()));
#else
    ui->mobileCloseButton->setVisible(false);
    ui->mobileSettingsButton->setVisible(false);

    ui->splitter->setStretchFactor(0,2);
    ui->splitter->setStretchFactor(1,1);
#endif

#ifdef QT_NO_PRINTER
    ui->printButton->setVisible(false);
#endif

    //initialize dataset table
    ui->datasetTable->setColumnCount(7);
    ui->datasetTable->verticalHeader()->hide();
    ui->datasetTable->horizontalHeader()->hide();
    ui->datasetTable->clearContents();
    ui->datasetTable->setShowGrid(false);
    ui->datasetTable->setSelectionMode(QAbstractItemView::NoSelection);
}

void PlotWindow::updateDatasetTable()
{   
    deleteDatasetTableItems();

    if (m_datasets != NULL)
    {
        ui->datasetTable->setRowCount(m_datasets->size());

        for (int i = 0; i < m_datasets->size(); i++)
        {
            QTableWidgetItem *item = new QTableWidgetItem(m_datasets->at(i)->name);
            item->setFlags(item->flags() | Qt::ItemIsEditable);
            ui->datasetTable->setItem(i,1,item);

            QCheckBox *checkBox = new QCheckBox();
            QButtonGroup *buttonGroupX = new QButtonGroup();
            QButtonGroup *buttonGroupY = new QButtonGroup();
            QRadioButton *radioButtonXB = new QRadioButton();
            QRadioButton *radioButtonXT = new QRadioButton();
            QRadioButton *radioButtonYL = new QRadioButton();
            QRadioButton *radioButtonYR = new QRadioButton();
            QToolButton *button =new QToolButton();

            buttonGroupX->addButton(radioButtonXB);
            buttonGroupX->addButton(radioButtonXT);
            buttonGroupY->addButton(radioButtonYL);
            buttonGroupY->addButton(radioButtonYR);

            ui->datasetTable->setCellWidget(i, 0, checkBox);
            ui->datasetTable->setCellWidget(i, 2, radioButtonXB);
            ui->datasetTable->setCellWidget(i, 3, radioButtonXT);
            ui->datasetTable->setCellWidget(i, 4, radioButtonYL);
            ui->datasetTable->setCellWidget(i, 5, radioButtonYR);
            ui->datasetTable->setCellWidget(i, 6, button);

            if (m_datasets->at(i)->plotXAxis == 0)
                radioButtonXB->setChecked(true);
            else
                radioButtonXT->setChecked(true);

            if(m_datasets->at(i)->plotYAxis == 0)
                radioButtonYL->setChecked(true);
            else
                radioButtonYL->setChecked(true);

            if (m_datasets->at(i)->plotted)
                checkBox->setChecked(true);

            button->setAutoRaise(true);
            button->setIcon(QIcon::fromTheme("edit-delete",QIcon(":/icons/edit-delete")));

            checkBox->setStyleSheet("QCheckBox::indicator {"
                                    "width: 16px;"
                                    "height: 16px;"
                                    "margin-left: 2px"
                                    "}"
                                    "QCheckBox::indicator:checked"
                                    "{"
                                    "image: url(:/icons/layer-visible-on);"
                                    "}"
                                    "QCheckBox::indicator:unchecked"
                                    "{"
                                    "image: url(:/icons/layer-visible-off);"
                                    "}");

            visibiltyCheckList.append(checkBox);
            xBRadioList.append(radioButtonXB);
            xTRadioList.append(radioButtonXT);
            yLRadioList.append(radioButtonYL);
            yRRadioList.append(radioButtonYR);
            xGroupList.append(buttonGroupX);
            yGroupList.append(buttonGroupY);
            deleteButtonList.append(button);

            connect(checkBox,SIGNAL(clicked()),
                    this,SLOT(updatePlots()));
            connect(radioButtonXB,SIGNAL(clicked()),
                    this,SLOT(updatePlots()));
            connect(radioButtonXT,SIGNAL(clicked()),
                    this,SLOT(updatePlots()));
            connect(radioButtonYL,SIGNAL(clicked()),
                    this,SLOT(updatePlots()));
            connect(radioButtonYR,SIGNAL(clicked()),
                    this,SLOT(updatePlots()));

            deleteSignalMapper->setMapping(button, i);
            connect(button,SIGNAL(clicked()),
                    deleteSignalMapper, SLOT(map()));
        }
    }

    ui->datasetTable->resizeColumnToContents(0);
    ui->datasetTable->resizeColumnToContents(2);
    ui->datasetTable->resizeColumnToContents(3);
    ui->datasetTable->resizeColumnToContents(4);
    ui->datasetTable->resizeColumnToContents(5);
    ui->datasetTable->resizeColumnToContents(6);

    updatePlots();
}

void PlotWindow::updatePlots()
{
    bool xBAxisInUse = false;
    bool xTAxisInUse = false;
    bool yLAxisInUse = false;
    bool yRAxisInUse = false;
    bool xBLogarithmic = false;
    bool xTLogarithmic = false;

    deletePlots();  //delete previous plots

    for (int i = 0; i < visibiltyCheckList.size(); i++)
    {
        bool checked = visibiltyCheckList.at(i)->isChecked();

        if (checked)
        {
            int xAxis;
            int yAxis;

            if (xBRadioList.at(i)->isChecked())
            {
                xBAxisInUse = true;
                xAxis = QwtPlot::xBottom;
                m_datasets->at(i)->plotXAxis = 0;

                if (m_datasets->at(i)->type == PhyxVariableManager::LogarithmicDataset)
                    xBLogarithmic = true;
            }
            else
            {
                xTAxisInUse = true;
                xAxis = QwtPlot::xTop;
                m_datasets->at(i)->plotXAxis = 1;

                if (m_datasets->at(i)->type == PhyxVariableManager::LogarithmicDataset)
                    xTLogarithmic = true;
            }
            if (yLRadioList.at(i)->isChecked())
            {
                yLAxisInUse = true;
                yAxis = QwtPlot::yLeft;
                m_datasets->at(i)->plotYAxis = 0;
            }
            else
            {
                yRAxisInUse = true;
                yAxis = QwtPlot::yRight;
                m_datasets->at(i)->plotYAxis = 1;
            }

            plotDataset(i, xAxis, yAxis);   //plot selected
        }

        xBRadioList.at(i)->setEnabled(checked);
        xTRadioList.at(i)->setEnabled(checked);
        yLRadioList.at(i)->setEnabled(checked);
        yRRadioList.at(i)->setEnabled(checked);
        m_datasets->at(i)->plotted = checked;
    }

    ui->qwtPlot->enableAxis(QwtPlot::xBottom,xBAxisInUse);
    ui->qwtPlot->enableAxis(QwtPlot::xTop,xTAxisInUse);
    ui->qwtPlot->enableAxis(QwtPlot::yLeft,yLAxisInUse);
    ui->qwtPlot->enableAxis(QwtPlot::yRight,yRAxisInUse);

    if (xBLogarithmic)
        ui->settingsXBLogCheck->setChecked(true);
    else
        ui->settingsXBLogCheck->setChecked(false);
    if (xTLogarithmic)
        ui->settingsXTLogCheck->setChecked(true);
    else
        ui->settingsXTLogCheck->setChecked(false);

    updateSettings();
}

void PlotWindow::plotDataset(int index, int xAxis, int yAxis)
{
    if (m_datasets->size() <= index)
        return;

    PhyxVariableManager::PhyxDataset *dataset = (*m_datasets)[index];

    //convert data
    QVector<double> x;
    QVector<double> y;

    for (int i = 0; i < dataset->data.at(0).size(); i++)
    {
        x.append(static_cast<PhyxFloatDataType>(dataset->data.at(0).at(i).real()));
        y.append(static_cast<PhyxFloatDataType>(dataset->data.at(1).at(i).real()));
    }

    QwtPlotCurve *plotCurve = new QwtPlotCurve(dataset->name);
    plotCurve->setRenderHint(QwtPlotItem::RenderAntialiased);
    plotCurve->setPen(QPen(qRgb(qrand() % 256,qrand() % 256,qrand() % 256)));
    plotCurve->setAxes(xAxis, yAxis);

#if QWT_VERSION >= 0x060000
    plotCurve->setSamples(x,y);
#else
    plotCurve->setData(x,y);
#endif
    plotCurve->attach(ui->qwtPlot);
    plotCurves.append(plotCurve);
}

void PlotWindow::deletePlots()
{
    for (int i = plotCurves.size()-1; i >= 0; i--)
    {
        QwtPlotCurve *plot = plotCurves[i];
        plotCurves.removeAt(i);
        plot->detach();
        delete plot;
    }
}

void PlotWindow::deleteDatasetTableItems()
{
    for (int i = 0; i < visibiltyCheckList.size(); i++)
    {
        visibiltyCheckList.at(i)->deleteLater();
        xBRadioList.at(i)->deleteLater();
        xTRadioList.at(i)->deleteLater();
        yLRadioList.at(i)->deleteLater();
        yRRadioList.at(i)->deleteLater();
        xGroupList.at(i)->deleteLater();
        yGroupList.at(i)->deleteLater();
        deleteButtonList.at(i)->deleteLater();
    }

    ui->datasetTable->clearContents();

    visibiltyCheckList.clear();
    xBRadioList.clear();
    xTRadioList.clear();
    yLRadioList.clear();
    yRRadioList.clear();
    xGroupList.clear();
    yGroupList.clear();
    deleteButtonList.clear();
}

void PlotWindow::updateMarkers()
{
    QwtPlotMarker *plotMarker = plotMarkers.at(0);

    plotMarker->setVisible(ui->marker1Group->isChecked());
    plotMarker->setValue(ui->marker1XSpin->value(), ui->marker1YSpin->value());
    plotMarker->setLineStyle((QwtPlotMarker::LineStyle)ui->marker1LineCombo->currentIndex());
    plotMarker->setLinePen(QPen(QColor(ui->colorMarkerLineButton->toolTip())));
    QwtSymbol *symbol = new QwtSymbol((QwtSymbol::Style)(ui->marker1SymbolCombo->currentIndex()-1));
    symbol->setPen(QPen(QColor(ui->colorMarkerSymbolButton->toolTip())));
    symbol->setBrush(QBrush(QColor(ui->colorMarkerSymbolButton->toolTip())));
    symbol->setSize(ui->marker1SymbolSizeSpin->value(),ui->marker1SymbolSizeSpin->value());
    plotMarker->setSymbol(symbol);

    ui->qwtPlot->replot();
}

void PlotWindow::updateSettings()
{
    if (ui->settingsTitleGroup->isChecked())
        ui->qwtPlot->setTitle(ui->settingsTitleEdit->text());
    else
        ui->qwtPlot->setTitle("");


    plotGrid->setVisible(ui->settingsGridGroup->isChecked());
    plotGrid->enableX(ui->settingsGridXCheck->isChecked());
    plotGrid->enableXMin(ui->settingsGridXMinCheck->isChecked());
    plotGrid->enableY(ui->settingsGridYCheck->isChecked());
    plotGrid->enableYMin(ui->settingsGridYMinCheck->isChecked());

    if (ui->settingsLegendGroup->isChecked())
    {
        ui->qwtPlot->insertLegend(NULL);
        legend = new QwtLegend();

        switch (ui->settingsLegendPositionCombo->currentIndex())
        {
        case 0: ui->qwtPlot->insertLegend(legend,QwtPlot::LeftLegend);
                break;
        case 1: ui->qwtPlot->insertLegend(legend,QwtPlot::RightLegend);
                break;
        case 2: ui->qwtPlot->insertLegend(legend,QwtPlot::BottomLegend);
                break;
        case 3: ui->qwtPlot->insertLegend(legend,QwtPlot::TopLegend);
                break;
        }
    }
    else
        ui->qwtPlot->insertLegend(NULL);

    //X title
    if (ui->settingsXBTitleGroup->isChecked())
        ui->qwtPlot->setAxisTitle(QwtPlot::xBottom, ui->settingsXBTitleEdit->text());
    else
        ui->qwtPlot->setAxisTitle(QwtPlot::xBottom, "");

    if (ui->settingsXTTitleGroup->isChecked())
        ui->qwtPlot->setAxisTitle(QwtPlot::xTop, ui->settingsXTTitleEdit->text());
    else
        ui->qwtPlot->setAxisTitle(QwtPlot::xTop, "");

    //Y title
    if (ui->settingsYLTitleGroup->isChecked())
        ui->qwtPlot->setAxisTitle(QwtPlot::yLeft, ui->settingsYLTitleEdit->text());
    else
        ui->qwtPlot->setAxisTitle(QwtPlot::yLeft, "");

    if (ui->settingsYRTitleGroup->isChecked())
        ui->qwtPlot->setAxisTitle(QwtPlot::yRight, ui->settingsYRTitleEdit->text());
    else
        ui->qwtPlot->setAxisTitle(QwtPlot::yRight, "");

    //X scale engine
    if (ui->settingsXBLogCheck->isChecked())
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::xBottom, new QwtLogScaleEngine);
    else
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::xBottom, new QwtLinearScaleEngine);

    if (ui->settingsXTLogCheck->isChecked())
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::xTop, new QwtLogScaleEngine);
    else
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::xTop, new QwtLinearScaleEngine);

    //Y scale engine
    if (ui->settingsYLLogCheck->isChecked())
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::yLeft, new QwtLogScaleEngine);
    else
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::yLeft, new QwtLinearScaleEngine);

    if (ui->settingsYRLogCheck->isChecked())
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::yRight, new QwtLogScaleEngine);
    else
        ui->qwtPlot->setAxisScaleEngine(QwtPlot::yRight, new QwtLinearScaleEngine);

    //axis inverting
    ui->qwtPlot->axisScaleEngine(QwtPlot::xBottom)->setAttribute(QwtScaleEngine::Inverted,ui->settingsXBInvCheck->isChecked());
    ui->qwtPlot->axisScaleEngine(QwtPlot::xTop)->setAttribute(QwtScaleEngine::Inverted,ui->settingsXTInvCheck->isChecked());
    ui->qwtPlot->axisScaleEngine(QwtPlot::yLeft)->setAttribute(QwtScaleEngine::Inverted,ui->settingsYLInvCheck->isChecked());
    ui->qwtPlot->axisScaleEngine(QwtPlot::yRight)->setAttribute(QwtScaleEngine::Inverted,ui->settingsYRInvCheck->isChecked());

    //X axis scale
    if (ui->settingsXBAutoscaleCheck->isChecked())
    {
        ui->qwtPlot->setAxisAutoScale(QwtPlot::xBottom);
        ui->qwtPlot->updateAxes();
        ui->settingsXBScaleMinSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::xBottom).lowerBound());
        ui->settingsXBScaleMaxSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::xBottom).upperBound());
        ui->settingsXBScaleStepSpin->setValue(ui->qwtPlot->axisStepSize(QwtPlot::xBottom));
    }
    else
        ui->qwtPlot->setAxisScale(QwtPlot::xBottom,
                                  ui->settingsXBScaleMinSpin->value(),
                                  ui->settingsXBScaleMaxSpin->value(),
                                  ui->settingsXBScaleStepSpin->value());

    if (ui->settingsXTAutoscaleCheck->isChecked())
    {
        ui->qwtPlot->setAxisAutoScale(QwtPlot::xTop);
        ui->qwtPlot->updateAxes();
        ui->settingsXTScaleMinSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::xTop).lowerBound());
        ui->settingsXTScaleMaxSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::xTop).upperBound());
        ui->settingsXTScaleStepSpin->setValue(ui->qwtPlot->axisStepSize(QwtPlot::xTop));
    }
    else
        ui->qwtPlot->setAxisScale(QwtPlot::xTop,
                                  ui->settingsXTScaleMinSpin->value(),
                                  ui->settingsXTScaleMaxSpin->value(),
                                  ui->settingsXTScaleStepSpin->value());

    //Y axis scale
    if (ui->settingsYLAutoscaleCheck->isChecked())
    {
        ui->qwtPlot->setAxisAutoScale(QwtPlot::yLeft);
        ui->qwtPlot->updateAxes();
        ui->settingsYLScaleMinSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::yLeft).lowerBound());
        ui->settingsYLScaleMaxSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::yLeft).upperBound());
        ui->settingsYLScaleStepSpin->setValue(ui->qwtPlot->axisStepSize(QwtPlot::yLeft));
    }
    else
        ui->qwtPlot->setAxisScale(QwtPlot::yLeft,
                                  ui->settingsYLScaleMinSpin->value(),
                                  ui->settingsYLScaleMaxSpin->value(),
                                  ui->settingsYLScaleStepSpin->value());

    if (ui->settingsYRAutoscaleCheck->isChecked())
    {
        ui->qwtPlot->setAxisAutoScale(QwtPlot::yRight);
        ui->qwtPlot->updateAxes();
        ui->settingsYRScaleMinSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::yRight).lowerBound());
        ui->settingsYRScaleMaxSpin->setValue(ui->qwtPlot->axisScaleDiv(QwtPlot::yRight).upperBound());
        ui->settingsYRScaleStepSpin->setValue(ui->qwtPlot->axisStepSize(QwtPlot::yRight));
    }
    else
        ui->qwtPlot->setAxisScale(QwtPlot::yRight,
                                  ui->settingsYRScaleMinSpin->value(),
                                  ui->settingsYRScaleMaxSpin->value(),
                                  ui->settingsYRScaleStepSpin->value());

    //update line settings
    for (int i = 0; i < plotCurves.size(); i++)
    {
        QPen pen = plotCurves.at(i)->pen();
        pen.setWidth(ui->settingsLineThicknessSpin->value());
        plotCurves.at(i)->setPen(pen);
    }

    ui->qwtPlot->setCanvasBackground(QColor(ui->colorBackgroundButton->toolTip()));
    QPalette p = ui->qwtPlot->palette();
    p.setColor(QPalette::Window, QColor(ui->colorPlotBackgroundButton->toolTip()));
    ui->qwtPlot->setPalette(p);

    plotGrid->setMajorPen(QPen(QColor(ui->colorGridButton->toolTip())));
    plotGrid->setMinorPen(QPen(QColor(ui->colorGridMinButton->toolTip())));

    QPalette palette;
    if (ui->qwtPlot->axisEnabled(QwtPlot::yLeft))
    {
        palette = ui->qwtPlot->axisWidget(QwtPlot::yLeft)->palette();
        palette.setColor(QPalette::WindowText, QColor(ui->colorAxisTicksButton->toolTip()));
        palette.setColor(QPalette::Text, QColor(ui->colorAxisFontButton->toolTip()));
        ui->qwtPlot->axisWidget(QwtPlot::yLeft)->setPalette(palette);
    }
    if (ui->qwtPlot->axisEnabled(QwtPlot::yRight))
    {
        palette = ui->qwtPlot->axisWidget(QwtPlot::yRight)->palette();
        palette.setColor(QPalette::WindowText, QColor(ui->colorAxisTicksButton->toolTip()));
        palette.setColor(QPalette::Text, QColor(ui->colorAxisFontButton->toolTip()));
        ui->qwtPlot->axisWidget(QwtPlot::yRight)->setPalette(palette);
    }
    if (ui->qwtPlot->axisEnabled(QwtPlot::xBottom))
    {
        palette = ui->qwtPlot->axisWidget(QwtPlot::xBottom)->palette();
        palette.setColor(QPalette::WindowText, QColor(ui->colorAxisTicksButton->toolTip()));
        palette.setColor(QPalette::Text, QColor(ui->colorAxisFontButton->toolTip()));
        ui->qwtPlot->axisWidget(QwtPlot::xBottom)->setPalette(palette);
    }
    if (ui->qwtPlot->axisEnabled(QwtPlot::xTop))
    {
        palette = ui->qwtPlot->axisWidget(QwtPlot::xTop)->palette();
        palette.setColor(QPalette::WindowText, QColor(ui->colorAxisTicksButton->toolTip()));
        palette.setColor(QPalette::Text, QColor(ui->colorAxisFontButton->toolTip()));
        ui->qwtPlot->axisWidget(QwtPlot::xTop)->setPalette(palette);
    }

    for (int i = 0; i < plotCurves.size(); i++)
    {
        QwtText title = plotCurves.at(i)->title();
        title.setColor(QColor(ui->colorAxisFontButton->toolTip()));
        plotCurves.at(i)->setTitle(title);
    }

    ui->qwtPlot->replot();
    plotZoomer->setZoomBase();
}

void PlotWindow::updatePixels()
{
    ui->exportHeightSpin->setValue(ui->exportHeightMMSpin->value() / 25.4 * ui->exportDpiXSpin->value());
    ui->exportWidthSpin->setValue(ui->exportWidthMMSpin->value() / 25.4 * ui->exportDpiXSpin->value());
}

void PlotWindow::updateMMs()
{
    ui->exportWidthMMSpin->setValue(ui->exportWidthSpin->value() / ui->exportDpiXSpin->value() * 25.4);
    ui->exportHeightMMSpin->setValue(ui->exportHeightSpin->value() / ui->exportDpiYSpin->value() * 25.4);
}

void PlotWindow::deleteDataset(int index)
{
    delete (*m_datasets)[index];
    m_datasets->removeAt(index);
    updateDatasetTable();
}

void PlotWindow::renameDataSet(int row, int column)
{
    m_datasets->at(row)->name = ui->datasetTable->item(row, column)->text();
    updatePlots();
}

void PlotWindow::copyToClipboard()
{
    QPixmap pixmap(ui->exportWidthSpin->value(), ui->exportHeightSpin->value());
    QPalette p = ui->qwtPlot->palette();
    pixmap.fill(p.color(QPalette::Window));


#if QWT_VERSION >= 0x060000
    QwtPlotRenderer renderer;

    // flags to make the document look like the widget
    renderer.setDiscardFlag(QwtPlotRenderer::DiscardBackground, false);
#if QWT_VERSION < 0x060100
        renderer.setLayoutFlag(QwtPlotRenderer::KeepFrames, true);
#endif

        renderer.renderTo(ui->qwtPlot, pixmap);
#else
    ui->qwtPlot->print(pixmap);
#endif

    QClipboard *clipboard = QApplication::clipboard();
    clipboard->setPixmap(pixmap);
}

void PlotWindow::saveDocument()
{
    const QList<QByteArray> imageFormats =
        QImageWriter::supportedImageFormats();

    QStringList filter;
#ifndef QWT_NO_SVG
    filter += "SVG Documents (*.svg)";
#endif
#if QWT_VERSION >= 0x060000
    filter += "PDF Documents (*.pdf)";
    filter += "Postscript Documents (*.ps)";
#endif

    if ( imageFormats.size() > 0 )
    {
        QString imageFilter("Images (");
        for ( int i = 0; i < imageFormats.size(); i++ )
        {
            if ( i > 0 )
                imageFilter += " ";
            imageFilter += "*.";
            imageFilter += imageFormats[i];
        }
        imageFilter += ")";

        filter += imageFilter;
    }

    QString docName = ui->qwtPlot->title().text();
    if (!docName.isEmpty())
        docName.replace (QRegExp(QString::fromLatin1("\n")), tr(" -- "));
    else
        docName = "plot";

    QString fileName = QFileDialog::getSaveFileName(
        this, tr("Save Plot"), QDir::homePath() + "/" + docName + ".svg",
        filter.join(";;"));

    if ( !fileName.isEmpty() )
    {
#if QWT_VERSION >= 0x060000
        QwtPlotRenderer renderer;

        // flags to make the document look like the widget
        renderer.setDiscardFlag(QwtPlotRenderer::DiscardBackground, false);
#if QWT_VERSION < 0x060100
        renderer.setLayoutFlag(QwtPlotRenderer::KeepFrames, true);
#endif

        renderer.renderDocument(ui->qwtPlot, fileName, QSizeF(ui->exportWidthMMSpin->value(), ui->exportHeightMMSpin->value()), ui->exportDpiXSpin->value());
#else
        QString extension = fileName.mid(fileName.lastIndexOf("."));

        if (extension == ".svg")
        {
            QSvgGenerator generator;
            generator.setFileName(fileName);
            generator.setSize(QSize(ui->exportWidthSpin->value(), ui->exportHeightSpin->value()));
            ui->qwtPlot->print(generator);
        }
        else
        {
            QPixmap pixmap(ui->exportWidthSpin->value(), ui->exportHeightSpin->value());
            QPalette p = ui->qwtPlot->palette();
            pixmap.fill(p.color(QPalette::Window));
            ui->qwtPlot->print(pixmap);
            pixmap.save(fileName);
        }
#endif
    }
}

void PlotWindow::printPlot()
{
#ifndef QT_NO_PRINTER
    QPrinter printer;

    QString docName = ui->qwtPlot->title().text();
    if (!docName.isEmpty())
    {
        docName.replace (QRegExp(QString::fromLatin1("\n")), tr(" -- "));
        printer.setDocName (docName);
    }

    printer.setCreator("PhyxCalc");
    printer.setOrientation(QPrinter::Landscape);

    QPrintDialog dialog(&printer);
    if (dialog.exec())
    {
#if QWT_VERSION >= 0x060000
        QwtPlotRenderer renderer;

        if ( printer.colorMode() == QPrinter::GrayScale )
        {
            renderer.setDiscardFlag(QwtPlotRenderer::DiscardCanvasBackground);
            renderer.setLayoutFlag(QwtPlotRenderer::FrameWithScales);
        }

        renderer.renderTo(ui->qwtPlot, printer);
#else
        QwtPlotPrintFilter filter;
        if ( printer.colorMode() == QPrinter::GrayScale )
        {
            int options = QwtPlotPrintFilter::PrintAll;
            options &= ~QwtPlotPrintFilter::PrintBackground;
            options |= QwtPlotPrintFilter::PrintFrameWithScales;
            filter.setOptions(options);
        }
        ui->qwtPlot->print(printer, filter);
#endif
    }
#endif
}

void PlotWindow::setButtonColor(QPushButton *button, QColor color)
{
    button->setStyleSheet(QString("border-color: rgb(0, 0, 0);\nborder: 2px solid;\nbackground-color: rgba(%1,%2,%3,%4)")
                                                       .arg(color.red())
                                                       .arg(color.green())
                                                       .arg(color.blue())
                                                       .arg(color.alpha()));
    button->setToolTip(color.name());
}

void PlotWindow::on_colorBackgroundButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorBackgroundButton->toolTip()),
                                          this,
                                          tr("Select Canvas Background Color"));
    if (color.isValid())
        setButtonColor(ui->colorBackgroundButton, color);

    updateSettings();
}

void PlotWindow::on_colorBackgroundDeleteButton_clicked()
{
    setButtonColor(ui->colorBackgroundButton, QColor(255,255,255));
    updateSettings();
}

void PlotWindow::on_colorPlotBackgroundButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorPlotBackgroundButton->toolTip()),
                                          this,
                                          tr("Select Plot Background Color"));
    if (color.isValid())
        setButtonColor(ui->colorPlotBackgroundButton, color);

    updateSettings();
}

void PlotWindow::on_colorPlotBackgroundDeleteButton_clicked()
{
    setButtonColor(ui->colorPlotBackgroundButton, QColor(255,255,255));
    updateSettings();
}

void PlotWindow::on_colorGridButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorGridButton->toolTip()),
                                          this,
                                          tr("Select Grid Color"));
    if (color.isValid())
        setButtonColor(ui->colorGridButton, color);

    updateSettings();
}

void PlotWindow::on_colorGridDeleteButton_clicked()
{
    setButtonColor(ui->colorGridButton, QColor("#c3c3c3"));
    updateSettings();
}

void PlotWindow::on_colorGridMinButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorGridMinButton->toolTip()),
                                          this,
                                          tr("Select Grid Color"));
    if (color.isValid())
        setButtonColor(ui->colorGridMinButton, color);

    updateSettings();
}

void PlotWindow::on_colorGridMinDeleteButton_clicked()
{
    setButtonColor(ui->colorGridMinButton, QColor("#dcdcdc"));
    updateSettings();
}

void PlotWindow::on_colorAxisTicksButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorAxisTicksButton->toolTip()),
                                          this,
                                          tr("Select Axis Color"));
    if (color.isValid())
        setButtonColor(ui->colorAxisTicksButton, color);

    updateSettings();
}

void PlotWindow::on_colorAxisTicksDeleteButton_clicked()
{
    setButtonColor(ui->colorAxisTicksButton, QColor(0,0,0));
    updateSettings();
}

void PlotWindow::on_colorAxisFontButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorAxisFontButton->toolTip()),
                                          this,
                                          tr("Select Axis Font Color"));
    if (color.isValid())
        setButtonColor(ui->colorAxisFontButton, color);

    updateSettings();
}

void PlotWindow::on_colorAxisFontDeleteButton_clicked()
{
    setButtonColor(ui->colorAxisFontButton, QColor(0,0,0));
    updateSettings();
}

void PlotWindow::on_colorMarkerLineButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorMarkerLineButton->toolTip()),
                                          this,
                                          tr("Select Marker Line Color"));
    if (color.isValid())
        setButtonColor(ui->colorMarkerLineButton, color);

    updateMarkers();
}

void PlotWindow::on_colorMarkerLineDeleteButton_clicked()
{
    setButtonColor(ui->colorMarkerLineButton, QColor(0,0,0));
    updateMarkers();
}

void PlotWindow::on_colorMarkerSymbolButton_clicked()
{
    QColor color = QColorDialog::getColor(QColor(ui->colorMarkerSymbolButton->toolTip()),
                                          this,
                                          tr("Select Marker Line Color"));
    if (color.isValid())
        setButtonColor(ui->colorMarkerSymbolButton, color);

    updateMarkers();
}

void PlotWindow::on_colorMarkerSymbolDeleteButton_clicked()
{
    setButtonColor(ui->colorMarkerSymbolButton, QColor(0,0,0));
    updateMarkers();
}

void PlotWindow::on_lineColorButton_clicked()
{
    for (int i = 0; i < plotCurves.size(); i++)
    {
        QPen pen = plotCurves.at(i)->pen();
        pen.setColor(qRgb(qrand() % 256,qrand() % 256,qrand() % 256));
        plotCurves.at(i)->setPen(pen);
    }
    ui->qwtPlot->replot();
}

void PlotWindow::on_settingsYLAutoscaleCheck_toggled(bool checked)
{
    ui->settingsYLScaleMaxSpin->setEnabled(!checked);
    ui->settingsYLScaleMinSpin->setEnabled(!checked);
    ui->settingsYLScaleStepSpin->setEnabled(!checked);
    ui->yLScaleLabel1->setEnabled(!checked);
    ui->yLScaleLabel2->setEnabled(!checked);
    ui->yLScaleLabel3->setEnabled(!checked);
}

void PlotWindow::on_settingsYRAutoscaleCheck_toggled(bool checked)
{
    ui->settingsYRScaleMaxSpin->setEnabled(!checked);
    ui->settingsYRScaleMinSpin->setEnabled(!checked);
    ui->settingsYRScaleStepSpin->setEnabled(!checked);
    ui->yRScaleLabel1->setEnabled(!checked);
    ui->yRScaleLabel2->setEnabled(!checked);
    ui->yRScaleLabel3->setEnabled(!checked);
}

void PlotWindow::on_settingsXBAutoscaleCheck_toggled(bool checked)
{
    ui->settingsXBScaleMaxSpin->setEnabled(!checked);
    ui->settingsXBScaleMinSpin->setEnabled(!checked);
    ui->settingsXBScaleStepSpin->setEnabled(!checked);
    ui->xBScaleLabel1->setEnabled(!checked);
    ui->xBScaleLabel2->setEnabled(!checked);
    ui->xBScaleLabel3->setEnabled(!checked);
}

void PlotWindow::on_settingsXTAutoscaleCheck_toggled(bool checked)
{
    ui->settingsXTScaleMaxSpin->setEnabled(!checked);
    ui->settingsXTScaleMinSpin->setEnabled(!checked);
    ui->settingsXTScaleStepSpin->setEnabled(!checked);
    ui->xTScaleLabel1->setEnabled(!checked);
    ui->xTScaleLabel2->setEnabled(!checked);
    ui->xTScaleLabel3->setEnabled(!checked);
}

void PlotWindow::on_exportCurrentButton_clicked()
{
    ui->exportWidthSpin->setValue(ui->qwtPlot->width());
    ui->exportHeightSpin->setValue(ui->qwtPlot->height());
    ui->exportDpiXSpin->setValue(QApplication::desktop()->physicalDpiX());
    ui->exportDpiYSpin->setValue(QApplication::desktop()->physicalDpiY());
    updateMMs();
}

void PlotWindow::on_mobileSettingsButton_clicked(bool checked)
{
    if (checked)
    {
        ui->tabWidget->show();
        ui->plotFrame->setVisible(false);
    }
    else
    {
        ui->tabWidget->hide();
        ui->plotFrame->setVisible(true);
    }
}
