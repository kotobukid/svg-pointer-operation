<template lang="pug">
  #app
    svg(
      width="480" height="500"
      @touchmove="tm"
      @touchstart="ts"
      @touchend="te"

      @pointerdown="tsp"
      @pointerup="tep"
      @pointermove="tmp"

      @wheel.stop.prevent="wheel"
    )
      g(:transform="`translate(${draw_origin.x}, ${draw_origin.y}) scale(${current_zoom})`")
        rect(x="-2000" y="-2000" width="4480" height="4600" fill="pink")
        g.grid
          line(
            v-for="y in [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000]"
            x1="0" x2="500" :y1="y" :y2="y" stroke-width="1" stroke="grey"
          )
          line(
            v-for="x in [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]"
            y1="0" y2="1000" :x1="x" :x2="x" stroke-width="1" stroke="grey"
          )
      g.finger-mark.circles
        g.circle(v-for="c in touches" :key="c.id")
          circle(:cx="c.clientX" :cy="c.clientY" r="5" fill="lightblue" stroke-width="3" stroke="blue")
          circle(:cx="c.clientX" :cy="c.clientY" r="100" fill="transparent" stroke-width="1" stroke="red")
      g.finger-mark.lines(v-if="touches.length > 1")
        line(
          :x1="touches[0].clientX" :y1="touches[0].clientY"
          :x2="touches[1].clientX" :y2="touches[1].clientY"
          stroke-width="3" stroke="white" fill="none")
        line(
          :x1="touches[0].clientX" :y1="touches[0].clientY"
          :x2="touches[1].clientX" :y2="touches[1].clientY"
          stroke-width="1" stroke="grey" fill="none")
        circle(
          :cx="(touches[0].clientX + touches[1].clientX) / 2"
          :cy="(touches[0].clientY + touches[1].clientY) / 2"
          r="10"
          stroke="green"
          stroke-width="1"
          fill="lightgreen"
        )
      g.finger-mark.pinch-start-point(v-if="touchable" :transform="`translate(${pinch_start_point.x}, ${pinch_start_point.y})`")
        line(x1="-10" y1="-10" x2="10" y2="10" stroke="blue" stroke-width="2")
        line(x1="10" y1="-10" x2="-10" y2="10" stroke="blue" stroke-width="2")
    .actions
      a.button(href="#" @click.prevent="reload") 再読込
      a.button(href="#" @click.prevent="save_camera") カメラ保存
      span(v-if="touchable") タッチ可能
      span(v-else) タッチ不可能
      br
      .camera-actions
        a.button(href="#" @click.prevent="load_camera($index)" v-for="(c, $index) in camera_history") カメラ{{ c.id }}
      .pan-actions
        a.button(href="#" @click.prevent="pan(-1, 0)") ⬅
        a.button(href="#" @click.prevent="pan(0, 1)") ⬇
        a.button(href="#" @click.prevent="pan(0, -1)") ⬆
        a.button(href="#" @click.prevent="pan(1, 0)") ➡
    .info
      span zoom_level {{ zoom_level }}
      span /
      span zoom {{ current_zoom }}
      br
      table
        colgroup
          col(style="width: 100px;")
          col(style="width: 100px;")
          col(style="width: 100px;")
        thead
          tr
            th ID
            th X
            th Y
        tbody
          tr(v-for="c in touches")
            td {{ c.id }}
            td {{ c.clientX }}
            td {{ c.clientY }}
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import _ from 'lodash';

declare type Point2D = {
  x: number, y: number
}

declare type Movement = {
  x: number, y: number
}

const clearElementSelection: Function = ((): any => {
  // @ts-ignore
  if ((<Window>window).getSelection) {
    // @ts-ignore
    if (window.getSelection()!.empty) {  // Chrome
      return () => {window.getSelection()!.empty();};
      // @ts-ignore
    } else if (window.getSelection()!.removeAllRanges) {  // Firefox
      return () => {window.getSelection()!.removeAllRanges();};
    }
    // @ts-ignore
  } else if (<Document>document.selection!) {  // IE
    // @ts-ignore
    return () => {document.selection!.empty();};
  } else {
    return () => {}
  }
})();


const INITIAL_ZOOM = 50;
const ZOOM_THRESHOLD = 0.05;
const ZOOM_THRESHOLD_SCALE_UP = Math.pow((1 + ZOOM_THRESHOLD), 2);
const ZOOM_THRESHOLD_SCALE_DOWN = Math.pow((1 + ZOOM_THRESHOLD), -2);

const ZOOM_LEVEL: number[] = _.map(_.range(-1 * INITIAL_ZOOM, 150), (n: number) => {
  return Math.pow(1 + ZOOM_THRESHOLD, n)
});
ZOOM_LEVEL[INITIAL_ZOOM] = 1.0;

declare type ZoomDirection = '' | 'up' | 'down';

@Component({
  components: {
  },
})
export default class App extends Vue {
  tm(e: TouchEvent) {
    if (this.touchable) {
      this.touchmove(e);
    } else {

    }
  }

  ts(e: TouchEvent) {
    if (this.touchable) {
      this.touchstart(e);
    } else {

    }
  }

  te(e: TouchEvent) {
    if (this.touchable) {
      this.touchend(e);
    } else {

    }
  }

  tsp(e: PointerEvent) {
    if (this.touchable) {

    } else {
      this.touchstartP(e);
    }
  }

  tep(e: PointerEvent) {
    if (this.touchable) {

    } else {
      this.touchendP(e)
    }
  }

  tmp(e: PointerEvent) {
    if (this.touchable) {

    } else {
      this.touchmoveP(e);
    }
  }

  noop() {
    console.log('noop');
  }

  get touchable(): boolean {
    return navigator.maxTouchPoints > 1;
  }

  touches: { id: number, clientX: number, clientY: number }[] = [];

  draw_origin: Point2D = {x: 0, y: 0};
  current_zoom: number = ZOOM_LEVEL[INITIAL_ZOOM];
  zoom_standard = -1;

  pan(deltaX: number, deltaY: number): void {
    this.draw_origin.x += deltaX;
    this.draw_origin.y += deltaY;
  }

  map_dragging: boolean = false;

  pinch_start_point: Point2D = {x: 240, y: 300}
  last_touch_point: Point2D = {x: 0, y: 0}

  reload(): void {
    location.reload();
  }

  wheel(e: WheelEvent): void {

    let zoom_up: boolean = true;
    if (e.deltaY > 0) {
      zoom_up = false;
    }

    this.change_zoom(zoom_up, e.clientX, e.clientY);
  }

  zoom_level: number = INITIAL_ZOOM;

  change_zoom(zoom_up: boolean, center_x: number, center_y: number) {
    const zoom_value_before = (() => {
      return this.current_zoom
    })();

    let zoom_level = this.zoom_level;
    if (zoom_up) {
      zoom_level = Math.min(ZOOM_LEVEL.length - 1, zoom_level + 1);
    } else {
      zoom_level = Math.max(0, zoom_level - 1);
    }

    this.current_zoom = ZOOM_LEVEL[zoom_level];
    this.zoom_level = zoom_level;

    const mouse_position: Point2D = {x: center_x, y: center_y};
    const draw_origin: Point2D = this.draw_origin;
    const zoom_value_after: number = this.current_zoom;
    const zoom_delta_ratio: number = zoom_value_after / zoom_value_before * -1;

    this.draw_origin = {
      x: Math.round((mouse_position.x - draw_origin.x) * zoom_delta_ratio + mouse_position.x),
      y: Math.round((mouse_position.y - draw_origin.y) * zoom_delta_ratio + mouse_position.y)
    };
  }

  camera_history: { x: number, y: number, zoom: number, id: number }[] = [];

  index_ = 0;

  load_camera(index: number): void {
    this.draw_origin.x = this.camera_history[index].x;
    this.draw_origin.y = this.camera_history[index].y;
    this.current_zoom = this.camera_history[index].zoom;
  }

  save_camera(): void {
    this.index_ += 1;
    this.camera_history.push(
        {
          x: this.draw_origin.x,
          y: this.draw_origin.y,
          zoom: this.current_zoom,
          id: this.index_
        }
    )
  }

  touchstart(e: TouchEvent): void {
    this.map_dragging = true;
    this.last_touch_point = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  touchstartP(e: PointerEvent): void {
    this.map_dragging = true;
    this.last_touch_point = {
      x: e.clientX,
      y: e.clientY
    }
  }

  touchend(e: TouchEvent): void {
    this.map_dragging = false;
    this.pinching = false;
    this.touches = [];
  }

  touchendP(e: PointerEvent): void {
    this.map_dragging = false;
  }

  touch_count: number = 0;

  touchmoveP(e: PointerEvent): void {
    if (this.map_dragging) {
      this.draw_origin.x += e.movementX;
      this.draw_origin.y += e.movementY;
    }
  }

  pinching: boolean = false;

  last_zoom_direction: ZoomDirection = '';

  touchmove(e: TouchEvent): void {
    if (e.touches.length === 1) {
      if (this.map_dragging) {
        if (this.touch_count === 1) {
          this.draw_origin.x += (e.touches[0].clientX - this.last_touch_point.x);
          this.draw_origin.y += (e.touches[0].clientY - this.last_touch_point.y);
        }
        this.last_touch_point = {x: e.touches[0].clientX, y: e.touches[0].clientY};
      }
      this.touch_count = 1;
      this.pinching = false;

    } else {
      //　指2本以上によるタッチ

      // パン操作
      const touch_center: Point2D = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      }

      this.last_touch_point = touch_center;

      // ピンチ操作
      const next_zoom_standard: number = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2);

      if (!this.pinching) {
        this.pinch_start_point.x = touch_center.x;
        this.pinch_start_point.y = touch_center.y;

        this.pinching = true;
      }

      if (next_zoom_standard > this.zoom_standard * ZOOM_THRESHOLD_SCALE_UP) {
        this.change_zoom(true, this.pinch_start_point.x, this.pinch_start_point.y);
        this.zoom_standard = next_zoom_standard;
        this.last_zoom_direction = 'up';
      } else if (next_zoom_standard < this.zoom_standard * ZOOM_THRESHOLD_SCALE_DOWN) {
        this.change_zoom(false, this.pinch_start_point.x, this.pinch_start_point.y);
        this.zoom_standard = next_zoom_standard;
        this.last_zoom_direction = 'down';
      }

      this.touch_count = e.touches.length;
    }

    this.touches = _.map(e.touches, (t) => {
      return {
        id: t.identifier,
        clientX: Math.floor(t.clientX),
        clientY: Math.floor(t.clientY),
      };
    });

    clearElementSelection();
  }
}
</script>

<style lang="less">
#app {
  .finger-mark, g.grid {
    pointer-events: none;
  }

  table {
    border-collapse: collapse;

    thead {
      border: 1px solid black;
    }

    th {
      background-color: black;
      color: white;
      border-left: 1px solid white;
      border-right: 1px solid white;
    }

    td {
      text-align: right;
      border: 1px solid black;
      overflow-x: hidden
    }
  }

  .camera-actions {
    margin-bottom: 5px;
  }

  .pan-actions {
    padding: 10px;

    a {
      padding: 10px 15px;
      border: 1px solid grey;
      text-decoration: none;
    }
  }
}

.button {
  padding: 0 10px;
  min-width: 40px;
  font-size: 1rem;
  line-height: 1rem;
  border: 1px solid grey;
  text-decoration: none;
  background-color: white;
  border-radius: 3px;

  &:active {
    background-color: pink;
    position: relative;
    top: 1px;
  }
}
</style>
