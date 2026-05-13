const tk = "2c9ed80a60a78f78f27aebfe05898681"

// 影像
export const image: string = `http://t4.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
export const imageLable: string = `http://t4.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`

// 地形
export const landform: string = `http://t4.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
export const landformLable: string = `http://t4.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`

export const maplibreStyle = {
  version: 8,
  sources: {
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
    // 影像
    {
      id: "tianditu-img",
      type: "raster",
      source: "tianditu-img",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "visible"
      }
    },
    {
      id: "tianditu-cia",
      type: "raster",
      source: "tianditu-cia",
      minzoom: 0,
      maxzoom: 18,
      layout: {
        visibility: "visible"
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
