<template lang="pug">
  #app
    svg(
      width="480" height="600"
      @touchmove="tm"
      @touchstart="ts"
      @pointerdown="tsp"
      @pointerup="tep"
      @pointermove="tmp"
      @wheel="wheel"
    )
      g(:transform="`translate(${global_translate.x}, ${global_translate.y}) scale(${current_scale})`")
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
        circle(:cx="circle_x" :cy="circle_y" r="100" stroke="black" stroke-width="1" :fill="dragging ? 'red' : 'grey'"
          @touchstart="sd"
          @touchend="stop_d"
          @pointerdown="sdp"
          @pointerup="stop_dP"
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
    .actions
      a.button(href="#" @click.prevent="reload") reload
      a.button(href="#" @click.prevent="save_camera") カメラ保存
      span(v-if="touchable") タッチ可能
      span(v-else) タッチ不可能
      br
      a.button(href="#" @click.prevent="load_camera($index)" v-for="(c, $index) in camera_history") {{ c.id }}
      .pan-actions
        a.button(href="#" @click.prevent="pan(-1, 0)") ⬅
        a.button(href="#" @click.prevent="pan(0, 1)") ⬇
        a.button(href="#" @click.prevent="pan(0, -1)") ⬆
        a.button(href="#" @click.prevent="pan(1, 0)") ➡
    .info
      span zoom_level {{ zoom_level }}
      span /
      span scale {{ current_scale }}
      br
      span  circle {{ circle_x }} , {{ circle_y }}
      br
      span  drag_start_point {{ drag_start_point.x }} , {{ drag_start_point.y }}
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
import HelloWorld from './components/HelloWorld.vue';
import _ from 'lodash';

declare type Point2D = {
  x: number, y: number
}

declare type Movement = {
  x: number, y: number
}

const ZOOM_LEVELS: number[] = [
  0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3
];

@Component({
  components: {
    HelloWorld,
  },
})
export default class App extends Vue {
  tm(e) {
    if (this.touchable) {
      this.touchmove(e);
    } else {
    }
  }

  ts(e) {
    if (this.touchable) {
      this.touchstart(e);
    } else {
    }
  }

  tsp(e) {
    if (this.touchable) {

    } else {
      this.touchstartP(e);
    }
  }

  tep(e) {
    if (this.touchable) {

    } else {
      this.touchendtP(e)
    }
  }

  tmp(e) {
    if (this.touchable) {
    } else {
      this.touchmoveP(e);
    }
  }

  sd(e) {
    if (this.touchable) {
      this.start_dragging(e);
    }
  }

  sdp(e) {
    if (this.touchable) {
    } else {
      this.start_draggingP(e);
    }
  }

  stop_d(e) {
    if (this.touchable) {
      this.stop_dragging();
    }
  }

  stop_dP(e) {
    if (this.touchable) {
    } else {
      this.stop_draggingP();
    }
  }

  noop() {
    console.log('noop')
  }

  get touchable(): boolean {
    return navigator.maxTouchPoints > 1;
  }

  touches: { id: number, clientX: number, clientY: number }[] = []

  global_translate: Point2D = {x: 0, y: 0};
  current_scale: number = 1.0;
  scale_standard = -1;

  pan(deltaX: number, deltaY: number): void {
    this.global_translate.x += deltaX;
    this.global_translate.y += deltaY;
  }

  dragging: boolean = false;

  start_draggingP(e: PointerEvent) {
    this.dragging = true;

    this.drag_start_point = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  start_dragging(e: TouchEvent) {
    this.dragging = true;

    this.drag_start_point = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  stop_dragging() {
    this.dragging = false;
  }

  stop_draggingP() {
    this.dragging = false;
  }

  drag_start_point: Point2D = {x: 240, y: 300}
  pinch_start_point: Point2D = {x: 240, y: 300}
  last_touch_point: Point2D = {x: 0, y: 0}
  circle_x: number = 240;
  circle_y: number = 300;

  reload(): void {
    location.reload();
  }

  wheel(e: WheelEvent): void {

    let zoom_up: boolean = true;
    if (e.deltaY > 0) {
      zoom_up = false;
    }

    this.change_scale(zoom_up, e.clientX, e.clientY);
  }

  zoom_level: number = 7;

  change_scale(zoom_up: boolean, center_x: number, center_y: number) {
    const next_scale_standard: number = Math.pow(center_x, 2) + Math.pow(center_y, 2);
    const zoom_value_before = this.current_scale * 1;
    let zoom_level = this.zoom_level;
    if (zoom_up) {
      zoom_level = Math.min(ZOOM_LEVELS.length - 1, zoom_level + 1);
    } else {
      zoom_level = Math.max(0, zoom_level - 1);
    }
    this.current_scale = ZOOM_LEVELS[zoom_level];
    this.zoom_level = zoom_level;

    this.scale_standard = next_scale_standard;

    const mouse_position: Point2D = {x: center_x, y: center_y};
    const draw_origin: Point2D = this.global_translate;
    const zoom_value_after: number = this.current_scale;
    const zoom_ratio: number = zoom_value_after / zoom_value_before * -1;

    this.global_translate = {
      x: Math.round((mouse_position.x - draw_origin.x) * zoom_ratio + mouse_position.x),
      y: Math.round((mouse_position.y - draw_origin.y) * zoom_ratio + mouse_position.y)
    };
  }

  camera_history: { x: number, y: number, scale: number, id: number }[] = [];

  index_ = 0;

  load_camera(index: number): void {
    this.global_translate.x = this.camera_history[index].x;
    this.global_translate.y = this.camera_history[index].y;
    this.current_scale = this.camera_history[index].scale;
  }

  save_camera(): void {
    this.index_ += 1;
    this.camera_history.push(
        {
          x: this.global_translate.x,
          y: this.global_translate.y,
          scale: this.current_scale,
          id: this.index_
        }
    )
  }


  touchstart(e: TouchEvent): void {
    this.last_touch_point = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  touchstartP(e: PointerEvent): void {
    this.dragging = true;
    this.last_touch_point = {
      x: e.clientX,
      y: e.clientY
    }
  }

  touchendtP(e: PointerEvent): void {
    this.dragging = false;
  }

  touch_count: number = 0;

  touchmoveP(e: PointerEvent): void {
    if (this.dragging) {
      this.global_translate.x += e.movementX;
      this.global_translate.y += e.movementY;
    }
  }

  pinching: boolean = false;

  touchmove(e: TouchEvent): void {

    if (e.touches.length === 1) {
      if (this.dragging) {
        this.circle_x = (e.touches[0].clientX - this.global_translate.x) / this.current_scale;
        this.circle_y = (e.touches[0].clientY - this.global_translate.y) / this.current_scale;
      } else {
        if (this.touch_count === 1) {
          this.global_translate.x += (e.touches[0].clientX - this.last_touch_point.x);
          this.global_translate.y += (e.touches[0].clientY - this.last_touch_point.y);
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
      const next_scale_standard: number = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2);

      if (!this.pinching) {
        this.pinch_start_point.x = touch_center.x;
        this.pinch_start_point.y = touch_center.y;

        this.pinching = true;
      }

      this.change_scale(!(next_scale_standard > this.scale_standard), this.pinch_start_point.x, this.pinch_start_point.y);

      this.touches = _.map(e.touches, (t) => {
        return {
          id: t.identifier,
          clientX: Math.floor(t.clientX),
          clientY: Math.floor(t.clientY),
        };
      });

      this.touch_count = e.touches.length;
    }
    // console.log(e)
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
  border: 1px solid grey;
}
</style>
