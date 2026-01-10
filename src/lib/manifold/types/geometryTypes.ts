// src/lib/manifold/types/geometryTypes.ts

/**
 * Podstawowe typy geometryczne dla Manifold CAD
 */

export interface Vec2 {
    x: number
    y: number
  }
  
  export interface Vec3 {
    x: number
    y: number
    z: number
  }
  
  /**
   * Vertex - Wierzchołek w przestrzeni 3D
   */
  export class Vertex {
    public id: string
    public position: Vec3
    public metadata: Map<string, any>
  
    constructor(x: number, y: number, z: number, id?: string) {
      this.id = id || `v_${Date.now()}_${Math.random()}`
      this.position = { x, y, z }
      this.metadata = new Map()
    }
  
    distanceTo(other: Vertex): number {
      const dx = this.position.x - other.position.x
      const dy = this.position.y - other.position.y
      const dz = this.position.z - other.position.z
      return Math.sqrt(dx * dx + dy * dy + dz * dz)
    }
  
    clone(): Vertex {
      const v = new Vertex(this.position.x, this.position.y, this.position.z)
      v.metadata = new Map(this.metadata)
      return v
    }
  }
  
  /**
   * Edge - Krawędź łącząca dwa wierzchołki
   */
  export class Edge {
    public id: string
    public start: Vertex
    public end: Vertex
    public metadata: Map<string, any>
  
    constructor(start: Vertex, end: Vertex, id?: string) {
      this.id = id || `e_${Date.now()}_${Math.random()}`
      this.start = start
      this.end = end
      this.metadata = new Map()
    }
  
    length(): number {
      return this.start.distanceTo(this.end)
    }
  
    midpoint(): Vertex {
      return new Vertex(
        (this.start.position.x + this.end.position.x) / 2,
        (this.start.position.y + this.end.position.y) / 2,
        (this.start.position.z + this.end.position.z) / 2
      )
    }
  
    direction(): Vec3 {
      const dx = this.end.position.x - this.start.position.x
      const dy = this.end.position.y - this.start.position.y
      const dz = this.end.position.z - this.start.position.z
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      return { x: dx / len, y: dy / len, z: dz / len }
    }
  }
  
  /**
   * Face - Ściana zdefiniowana przez listę wierzchołków
   */
  export class Face {
    public id: string
    public vertices: Vertex[]
    public normal?: Vec3
    public metadata: Map<string, any>
  
    constructor(vertices: Vertex[], id?: string) {
      this.id = id || `f_${Date.now()}_${Math.random()}`
      this.vertices = vertices
      this.metadata = new Map()
      this.computeNormal()
    }
  
    computeNormal(): void {
      if (this.vertices.length < 3) return
  
      const v0 = this.vertices[0].position
      const v1 = this.vertices[1].position
      const v2 = this.vertices[2].position
  
      // Cross product
      const ax = v1.x - v0.x
      const ay = v1.y - v0.y
      const az = v1.z - v0.z
  
      const bx = v2.x - v0.x
      const by = v2.y - v0.y
      const bz = v2.z - v0.z
  
      const nx = ay * bz - az * by
      const ny = az * bx - ax * bz
      const nz = ax * by - ay * bx
  
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      this.normal = { x: nx / len, y: ny / len, z: nz / len }
    }
  
    area(): number {
      if (this.vertices.length < 3) return 0
  
      // Shoelace formula dla polygonu
      let area = 0
      for (let i = 0; i < this.vertices.length; i++) {
        const j = (i + 1) % this.vertices.length
        const vi = this.vertices[i].position
        const vj = this.vertices[j].position
        area += vi.x * vj.y - vj.x * vi.y
      }
      return Math.abs(area) / 2
    }
  }
  
  /**
   * Point2D - Punkt na płaszczyźnie (dla rysowania 2D)
   */
  export class Point2D {
    public id: string
    public position: Vec2
    public metadata: Map<string, any>
  
    constructor(x: number, y: number, id?: string) {
      this.id = id || `p2d_${Date.now()}_${Math.random()}`
      this.position = { x, y }
      this.metadata = new Map()
    }
  
    distanceTo(other: Point2D): number {
      const dx = this.position.x - other.position.x
      const dy = this.position.y - other.position.y
      return Math.sqrt(dx * dx + dy * dy)
    }
  
    toVertex(z: number = 0): Vertex {
      return new Vertex(this.position.x, this.position.y, z)
    }
  }
  
  /**
   * Line2D - Linia na płaszczyźnie
   */
  export class Line2D {
    public id: string
    public start: Point2D
    public end: Point2D
    public metadata: Map<string, any>
  
    constructor(start: Point2D, end: Point2D, id?: string) {
      this.id = id || `l2d_${Date.now()}_${Math.random()}`
      this.start = start
      this.end = end
      this.metadata = new Map()
    }
  
    length(): number {
      return this.start.distanceTo(this.end)
    }
  
    toEdge(z: number = 0): Edge {
      return new Edge(this.start.toVertex(z), this.end.toVertex(z))
    }
  }
  
  /**
   * Contour2D - Zamknięty kontur na płaszczyźnie
   */
  export class Contour2D {
    public id: string
    public points: Point2D[]
    public closed: boolean
    public metadata: Map<string, any>
  
    constructor(points: Point2D[] = [], id?: string) {
      this.id = id || `contour_${Date.now()}_${Math.random()}`
      this.points = points
      this.closed = false
      this.metadata = new Map()
    }
  
    addPoint(point: Point2D): void {
      if (!this.closed) {
        this.points.push(point)
      }
    }
  
    close(): boolean {
      if (this.points.length < 3) return false
      this.closed = true
      return true
    }
  
    isClosed(): boolean {
      return this.closed
    }
  
    getLines(): Line2D[] {
      const lines: Line2D[] = []
      for (let i = 0; i < this.points.length - 1; i++) {
        lines.push(new Line2D(this.points[i], this.points[i + 1]))
      }
      if (this.closed && this.points.length > 0) {
        lines.push(new Line2D(this.points[this.points.length - 1], this.points[0]))
      }
      return lines
    }
  
    area(): number {
      if (this.points.length < 3) return 0
  
      let area = 0
      for (let i = 0; i < this.points.length; i++) {
        const j = (i + 1) % this.points.length
        area += this.points[i].position.x * this.points[j].position.y
        area -= this.points[j].position.x * this.points[i].position.y
      }
      return Math.abs(area) / 2
    }
  
    centroid(): Vec2 {
      if (this.points.length === 0) return { x: 0, y: 0 }
  
      let cx = 0, cy = 0
      for (const p of this.points) {
        cx += p.position.x
        cy += p.position.y
      }
      return { x: cx / this.points.length, y: cy / this.points.length }
    }
  }
  
  /**
   * ExtrusionProfile - Profil do ekstruzji
   */
  export interface ExtrusionProfile {
    contour: Contour2D
    height: number
    direction: Vec3
    twist?: number
    scale?: { start: number, end: number }
  }
  
  /**
   * CADOperation - Typ operacji CAD
   */
  export enum CADOperationType {
    DRAW = 'draw',
    EXTRUDE = 'extrude',
    UNION = 'union',
    DIFFERENCE = 'difference',
    INTERSECTION = 'intersection',
    TRANSFORM = 'transform'
  }
  
  /**
   * CADOperation - Historia operacji
   */
  export interface CADOperation {
    id: string
    type: CADOperationType
    timestamp: number
    data: any
    result?: any
  }