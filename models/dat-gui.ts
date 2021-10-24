import * as THREE from "three";
import { AxesHelper, GridHelper, Material } from "three";
// Helper classes for using Dat.Gui

// Turns both axes and grid visible on/off
// dat.GUI requires a property that returns a bool
// to decide to make a checkbox so we make a setter
// and getter for `visible` which we can tell dat.GUI
// to look at.
export class AxisGridHelper {
    private _visible: boolean = false;
    grid: GridHelper;
    axes: AxesHelper;

    constructor(node, units = 10) {
        const axes = new THREE.AxesHelper();
        (axes.material as Material).depthTest = false;
        axes.renderOrder = 2; // after the grid
        node.add(axes);

        const grid = new THREE.GridHelper(units, units);
        (grid.material as Material).depthTest = false;
        grid.renderOrder = 1;
        node.add(grid);

        this.grid = grid;
        this.axes = axes;
        this.visible = false;
    }

    get visible() {
        return this._visible;
    }

    set visible(v) {
        this._visible = v;
        this.grid.visible = v;
        this.axes.visible = v;
    }
}
