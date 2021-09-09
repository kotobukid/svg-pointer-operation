<template lang="pug">
  g.object_layer(:transform="`translate(${draw_origin.x}, ${draw_origin.y}) scale(${zoom})`")
    circle(
      :cx="cx"
      :cy="cy"
      :r="is_dragging ? 40 : 30"
      :fill="is_dragging ? ' lightblue': 'white'"
      :stroke="is_dragging ? ' blue': 'lightblue'"
      stroke-width="2"

      @touchstart="start_drag_proxy"
      @pointerdown="start_drag_proxy"

      @touchend="stop_drag"
      @pointerup="stop_drag"
      @pointerleave="stop_drag"

      @touchmove.stop.prevent="drag_proxy"
      @pointermove.stop.prevent="drag_proxy"
    )
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';


declare type Point2D = {
  x: number, y: number
}

@Component({
  components: {},
})
export default class ObjectLayer extends Vue {
  @Prop({default: {x: 0, y: 0}})
  readonly draw_origin!: Point2D;

  @Prop({default: {x: 0, y: 0}})
  readonly zoom!: number;

  get touchable(): boolean {
    return navigator.maxTouchPoints > 1;
  }

  cx: number = 200;
  cy: number = 200;
  is_dragging: boolean = false;

  touch_start_point: Point2D = {x: 0, y: 0};

  start_drag_proxy(e: TouchEvent | PointerEvent): void {
    if (this.touchable) {
      this.start_drag(<TouchEvent>e);
    } else {
      this.start_drag_p(<PointerEvent>e);
    }
  }

  start_drag(e: TouchEvent): void {
    this.is_dragging = true;

    this.touch_start_point.x = e.touches[0].clientX;
    this.touch_start_point.y = e.touches[0].clientY;
  }

  start_drag_p(e: PointerEvent): void {
    this.is_dragging = true;
  }

  drag_proxy(e: TouchEvent | PointerEvent): void {
    if (this.is_dragging) {
      if (this.touchable) {
        this.drag(<TouchEvent>e);
      } else {
        this.drag_p(<PointerEvent>e);
      }
    }
  }

  stop_drag(): void {
    this.is_dragging = false;
  }

  drag(e: TouchEvent): void {
    this.cx += ((e.touches[0].clientX - this.touch_start_point.x) / this.zoom);
    this.cy += ((e.touches[0].clientY - this.touch_start_point.y) / this.zoom);

    this.touch_start_point.x = e.touches[0].clientX;
    this.touch_start_point.y = e.touches[0].clientY;
  }

  drag_p(e: PointerEvent): void {
    if (!(e.movementX == undefined)) {
      this.cx += (e.movementX / this.zoom);
      this.cy += (e.movementY / this.zoom);
    }
  }
}
</script>

<style lang="less">

</style>
