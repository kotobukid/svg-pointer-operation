<template lang="pug">
  #app
    svg(
      width="480" height="600"
      @touchmove="touchmove"
      @touchstart="touchstart"
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
          @touchstart="start_dragging"
          @touchend="stop_dragging"
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
      .pan-actions
        a.button(href="#" @click.prevent="pan(-1, 0)") ⬅
        a.button(href="#" @click.prevent="pan(0, 1)") ⬇
        a.button(href="#" @click.prevent="pan(0, -1)") ⬆
        a.button(href="#" @click.prevent="pan(1, 0)") ➡
    .info
      span  scale {{ current_scale }}
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

@Component({
  components: {
    HelloWorld,
  },
})
export default class App extends Vue {
  touches: { id: number, clientX: number, clientY: number }[] = []

  global_translate: Point2D = {x: 0, y: 0};
  current_scale: number = 1.0;
  scale_standard = -1;

  pan(deltaX: number, deltaY: number): void {
    this.global_translate.x += deltaX;
    this.global_translate.y += deltaY;
  }

  dragging: boolean = false;

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

  drag_start_point: Point2D = {x: 240, y: 300}
  last_touch_point: Point2D = {x: 0, y: 0}
  circle_x: number = 240;
  circle_y: number = 300;

  reload(): void {
    location.reload();
  }

  touchstart(e: TouchEvent): void {
    this.last_touch_point = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  touch_count: number = 0;

  touchmove(e: TouchEvent): void {

    if (e.touches.length === 1) {
      if (this.dragging) {
        this.circle_x = (e.touches[0].clientX - this.global_translate.x)  / this.current_scale;
        this.circle_y = (e.touches[0].clientY - this.global_translate.y)  / this.current_scale;
      } else {
        if (this.touch_count === 1) {
          this.global_translate.x += (e.touches[0].clientX - this.last_touch_point.x);
          this.global_translate.y += (e.touches[0].clientY - this.last_touch_point.y);
        }
        this.last_touch_point = {x: e.touches[0].clientX, y: e.touches[0].clientY};
      }
      this.touch_count = 1;
    } else {
      //　指2本以上によるタッチ

      // パン操作
      const touch_center: Point2D = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      }
      if (this.touch_count === 2) {
        this.global_translate.x += (touch_center.x - this.last_touch_point.x);
        this.global_translate.y += (touch_center.y - this.last_touch_point.y);
      }

      this.last_touch_point = touch_center;

      // ピンチ操作
      // if (this.touch_count === 2) {
      //   if (this.scale_standard === -1) {
      //     // 指が1本から2本になった瞬間
      //     this.scale_standard = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2);
      //   } else {
      //     this.current_scale *= Math.sqrt((Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)) / this.scale_standard)
      //   }
      // } else {
      //   this.scale_standard = -1;
      // }

      const next_scale_standard: number = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2);
      if (next_scale_standard > this.scale_standard) {
        this.current_scale = Math.min(2, this.current_scale + 0.05);
      } else {
        this.current_scale = Math.max(0.5, this.current_scale - 0.05);
      }
      this.scale_standard = next_scale_standard;

      this.touches = _.map(e.touches, (t) => {
        return {
          id: t.identifier,
          clientX: Math.floor(t.clientX),
          clientY: Math.floor(t.clientY),
        };
      });

      this.touch_count = e.touches.length;
    }
      console.log(e)
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

</style>
