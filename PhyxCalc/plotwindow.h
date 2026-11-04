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
#ifndef PLOTWINDOW_H
#define PLOTWINDOW_H

#include <QMainWindow>
#include <QFileDialog>
#include <QListWidgetItem>
#include <QPrinter>
#include <QPrintDialog>
#include <QColorDialog>
#include <QImageWriter>
#include <QApplication>
#include <QDesktopWidget>
#include <QClipboard>
#include <QCloseEvent>
#include <QShowEvent>
#include <QRadioButton>
#include <QToolButton>
#include <QCheckBox>
#include <QSignalMapper>
#include <QDebug>
#include <qwt_plot.h>
#include <qwt_plot_marker.h>
#include <qwt_plot_curve.h>
#include <qwt_plot_grid.h>
#include <qwt_plot_zoomer.h>
#include <qwt_plot_marker.h>
#include <qwt_plot_picker.h>
#include <qwt_picker_machine.h>
#include <qwt_symbol.h>
#include <qwt_legend.h>
#include <qwt_scale_widget.h>
#include <qwt_scale_div.h>
#include <qwt_scale_engine.h>
#if QWT_VERSION >= 0x060000
#include <qwt_plot_renderer.h>
#endif
#ifdef QT_SVG_LIB
#include <QSvgGenerator>
#endif
#include "phyxvariablemanager.h"
#include "global.h"

namespace Ui {
class PlotWindow;
}

class PlotWindow : public QMainWindow
{
    Q_OBJECT
    Q_PROPERTY(PhyxVariableManager::PhyxDatasetList *datasets READ datasets WRITE setDatasets)

protected:
    void closeEvent(QCloseEvent *event);
    void showEvent (QShowEvent * event);
    
public:
    explicit PlotWindow(QWidget *parent = 0);
    ~PlotWindow();
    
    PhyxVariableManager::PhyxDatasetList * datasets() const
    {
        return m_datasets;
    }

public slots:
    void setDatasets(PhyxVariableManager::PhyxDatasetList * arg)
    {
        m_datasets = arg;
        updateDatasetTable();
    }

private slots:
    void updatePlots();
    void updateMarkers();
    void updateSettings();
    void updatePixels();
    void updateMMs();

    void deleteDataset(int index);
    void renameDataSet(int row, int column);

    void copyToClipboard();
    void saveDocument();
    void printPlot();

    void on_colorBackgroundButton_clicked();

    void on_colorBackgroundDeleteButton_clicked();

    void on_colorGridButton_clicked();

    void on_colorGridDeleteButton_clicked();

    void on_colorAxisTicksButton_clicked();

    void on_colorAxisTicksDeleteButton_clicked();

    void on_colorAxisFontButton_clicked();

    void on_colorAxisFontDeleteButton_clicked();

    void on_colorGridMinButton_clicked();

    void on_colorGridMinDeleteButton_clicked();

    void on_lineColorButton_clicked();

    void on_colorPlotBackgroundButton_clicked();

    void on_colorPlotBackgroundDeleteButton_clicked();

    void on_settingsYLAutoscaleCheck_toggled(bool checked);

    void on_settingsYRAutoscaleCheck_toggled(bool checked);

    void on_settingsXBAutoscaleCheck_toggled(bool checked);

    void on_settingsXTAutoscaleCheck_toggled(bool checked);

    void on_exportCurrentButton_clicked();

    void on_mobileSettingsButton_clicked(bool checked);

    void on_colorMarkerLineButton_clicked();

    void on_colorMarkerLineDeleteButton_clicked();

    void on_colorMarkerSymbolButton_clicked();

    void on_colorMarkerSymbolDeleteButton_clicked();

private:
    Ui::PlotWindow *ui;
    PhyxVariableManager::PhyxDatasetList * m_datasets;

    QList<QwtPlotCurve*> plotCurves;
    QList<QwtPlotMarker*> plotMarkers;
    QwtPlotGrid         *plotGrid;
    QwtPlotZoomer       *plotZoomer;
    QwtPlotPicker       *plotPicker;
    QwtLegend           *legend;

    QList<QCheckBox*>       visibiltyCheckList;
    QList<QRadioButton*>    xBRadioList;
    QList<QRadioButton*>    xTRadioList;
    QList<QRadioButton*>    yLRadioList;
    QList<QRadioButton*>    yRRadioList;
    QList<QButtonGroup*>    xGroupList;
    QList<QButtonGroup*>    yGroupList;
    QList<QToolButton*>     deleteButtonList;

    QSignalMapper *deleteSignalMapper;

    void initializeGUI();

    void updateDatasetTable();
    void plotDataset(int index, int xAxis, int yAxis);
    void deletePlots();
    void deleteDatasetTableItems();

    void setButtonColor(QPushButton *button, QColor color);

signals:
    void visibilityChanged(bool);
};

#endif // PLOTWINDOW_H
