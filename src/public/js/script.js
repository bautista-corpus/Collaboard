var socket = io();

var canvas = new fabric.Canvas('c');
var isFreeDrawing = false;
var isRectActive = false,
    isCircleActive = false,
    isArrowActive = false,
    activeColor = '#000000';
var isLoadedFromJson = false;

//init variables
var div = $("#canvasWrapper");
var $canvas = $("#c");

//width and height of canvas's wrapper
var w, h;
w = div.width();
h = div.height();
$canvas.width(w).height(h);

//set w & h for canvas
canvas.setHeight(h);
canvas.setWidth(w);

function initCanvas(canvas) {
    //canvas.clear();
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.shadow = new fabric.Shadow({
        blur: 0,
        offsetX: 0,
        offsetY: 0,
        affectStroke: true,
        color: '#ffffff',
    });
    canvas.freeDrawingBrush.width = 5;
    canvas.isDrawingMode = false;

    return canvas;
}

function setBrush(options) {
    if (options.width !== undefined) {
        canvas.freeDrawingBrush.width = parseInt(options.width, 10);
    }

    if (options.color !== undefined) {
        canvas.freeDrawingBrush.color = options.color;
    }
}

function setCanvasSelectableStatus(val) {
    canvas.forEachObject(function (obj) {
        obj.lockMovementX = !val;
        obj.lockMovementY = !val;
        obj.hasControls = val;
        obj.hasBorders = val;
        obj.selectable = val;
    });
    //canvas.renderAll();
}

function setFreeDrawingMode(val) {
    isFreeDrawing = val;
    disableShapeMode();
}

function removeCanvasEvents() {
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.off('object:moving');
}

function enableShapeMode() {
    removeCanvasEvents();
    isFreeDrawing = canvas.isDrawingMode;
    canvas.isDrawingMode = false;
    canvas.selection = false;
    setCanvasSelectableStatus(false);
}

function disableShapeMode() {
    removeCanvasEvents();
    canvas.isDrawingMode = isFreeDrawing;
    if (isFreeDrawing) {
        $("#drwToggleDrawMode").addClass('active');
    }
    canvas.selection = true;
    isArrowActive = isRectActive = isCircleActive = false;
    setCanvasSelectableStatus(true);
}

function deleteObjects() {
    let activeGroup = canvas.getActiveObjects();

    if (activeGroup) {
        canvas.discardActiveObject();
        activeGroup.forEach(function (object) {
            canvas.remove(object);
        });
    }
}

function emitEvent() {
    let aux = canvas;
    let json = aux.toJSON();
    let data = {
        w: w,
        h: h,
        data: json
    };
    socket.emit('drawing', data);
}


$(function () {

    $(document).ready(function () {
        socket.emit('load', 'Loading Canvas');
    });
    //Canvas init
    //initCanvas(canvas).renderAll();

    //canvas events

    canvas.on('after:render', function () {
        if (!isLoadedFromJson) {
            emitEvent();
        }
        isLoadedFromJson = false;
        console.log(canvas.toJSON());
    });

    //dynamically resize the canvas on window resize
    $(window)
        .on('resize', function () {
            w = div.width();
            h = div.height();
            canvas.setHeight(h);
            canvas.setWidth(w);
            $canvas.width(w).height(h);
        })
        .on('keydown', function (e) {
            if (e.keyCode === 46) { //delete key
                deleteObjects();
            }
        });

    //Set Brush Size
    $(".size-btns button").on('click', function () {
        $(".size-btns button").removeClass('active');
        $(this).addClass('active');
    });

    //Set brush color
    $(".color-btns button").on('click', function () {
        let val = $(this).data('value');
        activeColor = val;
        $("#brushColor").val(val);
        setBrush({
            color: val
        });
    });

    $("#brushColor").on('change', function () {
        let val = $(this).val();
        activeColor = val;
        setBrush({
            color: val
        });
    });

    //Toggle between drawing tools
    $("#drwToggleDrawMode").on('click', function () {
        $("#toolbox button").removeClass('active');
        if (canvas.isDrawingMode) {
            setFreeDrawingMode(false);
            $(this).removeClass('active');
        } else {
            setFreeDrawingMode(true);
            $(this).addClass('active');
        }
    });

    $("#drwEraser").on('click', function () {
        deleteObjects();
    });

    $("#drwClearCanvas").on('click', function () {
        canvas.clear();
    });

    $("#shapeArrow").on('click', function () {
        if (!isArrowActive || (isRectActive || isCircleActive)) {
            disableShapeMode();
            $("#toolbox button").removeClass('active');
            $(this).addClass('active');
            isArrowActive = true;
            enableShapeMode();
            var textarea = new Textarea(canvas);
            var hola = 1;
        } else {
            disableShapeMode();
            isArrowActive = false;
            $(this).removeClass('active');
        }
    });

    $("#shapeCircle").on('click', function () {
        if (!isCircleActive || (isRectActive || isArrowActive)) {
            disableShapeMode();
            $("#toolbox button").removeClass('active');
            $(this).addClass('active');
            isCircleActive = true;
            enableShapeMode();
            var circle = new Circle(canvas);
        } else {
            disableShapeMode();
            isCircleActive = false;
            $(this).removeClass('active');
        }
    });

    $("#shapeRect").on('click', function () {
        if (!isRectActive || (isArrowActive || isCircleActive)) {
            disableShapeMode();
            isRectActive = true;
            $("#toolbox button").removeClass('active');
            $(this).addClass('active');
            enableShapeMode();
            var squrect = new Rectangle(canvas);
        } else {
            isRectActive = false;
            disableShapeMode();
            $(this).removeClass('active');
        }
    });

    $("#debugButton").on('click', function () {
        deleteObjects();
    });

    socket.on('drawing', function (obj) {
        //set this flag, to disable infinite rendering loop
        isLoadedFromJson = true;

        //calculate ratio by dividing this canvas width to sender canvas width
        let ratio = w / obj.w;

        //reposition and rescale each sent canvas object
        obj.data.objects.forEach(function (object) {
            object.left *= ratio;
            object.scaleX *= ratio;
            object.top *= ratio;
            object.scaleY *= ratio;
        });

        canvas.loadFromJSON(obj.data);
    });


});