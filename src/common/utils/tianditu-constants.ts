const tk = "2c9ed80a60a78f78f27aebfe05898681"

/** 支持的地图样式类型 */
export type MapStyleType = "vector" | "image" | "terrain"

/** 地图样式配置项 */
export interface MapStyleOption {
  /** 样式 key */
  type: MapStyleType
  /** 显示名称 */
  label: string
  /** 底图图层 id 列表（显示时 visible） */
  layerIds: string[]
}

/** 所有地图样式选项 */
export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    type: "vector",
    label: "矢量",
    layerIds: ["tianditu-vec", "tianditu-cva"]
  },
  {
    type: "image",
    label: "影像",
    layerIds: ["tianditu-img", "tianditu-cia"]
  },
  {
    type: "terrain",
    label: "地形",
    layerIds: ["tianditu-ter", "tianditu-cta"]
  }
]

// 影像
export const image: string = `http://t4.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
export const imageLable: string = `http://t4.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`

// 地形
export const landform: string = `http://t4.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
export const landformLable: string = `http://t4.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`

// 矢量
export const vectorForm: string = `http://t4.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
export const vectorFormLable: string = `http://t4.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`

export const maplibreStyle = {
  version: 8,
  sources: {
    // 矢量底图
    "tianditu-vec": {
      type: "raster",
      tiles: [vectorForm],
      tileSize: 256
    },
    "tianditu-cva": {
      type: "raster",
      tiles: [vectorFormLable],
      tileSize: 256
    },
    // 影像底图
    "tianditu-img": {
      type: "raster",
      tiles: [image],
      tileSize: 256
    },
    "tianditu-cia": {
      type: "raster",
      tiles: [imageLable],
      tileSize: 256
    },
    // 地形底图
    "tianditu-ter": {
      type: "raster",
      tiles: [landform],
      tileSize: 256
    },
    "tianditu-cta": {
      type: "raster",
      tiles: [landformLable],
      tileSize: 256
    }
  },
  layers: [
    // 矢量
    {
      id: "tianditu-vec",
      type: "raster",
      source: "tianditu-vec",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "none"
      }
    },
    {
      id: "tianditu-cva",
      type: "raster",
      source: "tianditu-cva",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "none"
      }
    },
    // 影像
    {
      id: "tianditu-img",
      type: "raster",
      source: "tianditu-img",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "none"
      }
    },
    {
      id: "tianditu-cia",
      type: "raster",
      source: "tianditu-cia",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "none"
      }
    },
    // 地形
    {
      id: "tianditu-ter",
      type: "raster",
      source: "tianditu-ter",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "none"
      }
    },
    {
      id: "tianditu-cta",
      type: "raster",
      source: "tianditu-cta",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "none"
      }
    }
  ]
}
