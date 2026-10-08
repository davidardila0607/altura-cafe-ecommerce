# Guía — Pedidos

> En el PDF del profesor aparece como "Guía 2 — Pedidos". Va después de la guía del carrito y antes de la de Wompi.

## Objetivo

En esta guía se ampliará el e-commerce construido en la Guía 1 para permitir que los usuarios:

- Creen pedidos a partir del carrito.
- Consulten sus pedidos.
- Consulten el detalle de un pedido.
- Eviten comprar sus propios productos.

## 1. Crear la clase Pedido

En la carpeta `Models` vamos a crear la siguiente clase:

```csharp
public class Pedido
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public ICollection<PedidoProducto> Productos { get; set; } = new List<PedidoProducto>();
}
```

## 2. Crear PedidoProducto

```csharp
public class PedidoProducto
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public Pedido? Pedido { get; set; }
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }
}
```

### ¿Por qué guardar Precio?

Porque el precio del producto puede cambiar después.

## 3. Agregar los DbSet

En el archivo `AppDbContext` agregar los siguientes DbSets:

```csharp
public DbSet<Pedido> Pedido { get; set; }
public DbSet<PedidoProducto> PedidoProducto { get; set; }
```

## 4. Modificar Usuario

Modificarlo para relacionarlo con el pedido agregando el siguiente atributo:

```csharp
public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
```

## 5. Crear la migración

```bash
dotnet ef migrations add AddPedidos
dotnet ef database update
```

## 6. Crear DTOs

En la carpeta `DTOs` crear las siguientes clases:

```csharp
public class PedidoDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string? Estado { get; set; }
    public decimal Total { get; set; }
    public List<PedidoProductoDto> Productos { get; set; } = new();
}

public class PedidoProductoDto
{
    public int ProductoId { get; set; }
    public string? Nombre { get; set; }
    public string? ImagenUrl { get; set; }
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }
}
```

## 7. Crear PedidoRepository

Crear la interfaz `IPedidoRepository` en la carpeta `Interfaces`:

```csharp
public interface IPedidoRepository
{
    Task<string> CrearPedido(int usuarioId);
    Task<List<PedidoDto>> ObtenerPedidos(int usuarioId);
    Task<PedidoDto> ObtenerPedido(int usuarioId, int pedidoId);
}
```

En la carpeta `Repositories` crear el repositorio `PedidoRepository` implementando la interfaz:

```csharp
public class PedidoRepository : IPedidoRepository
{
}
```

Registrar el repositorio:

```csharp
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();
```

## 8. Crear pedido a partir del carrito

```csharp
public async Task<string> CrearPedido(int usuarioId)
{
    var carrito = await _context.Carrito
        .Include(x => x.Productos)
        .ThenInclude(x => x.Producto)
        .FirstOrDefaultAsync(x => x.UsuarioId == usuarioId);

    if (carrito == null || !carrito.Productos.Any())
    {
        return "El carrito está vacío.";
    }

    var pedido = new Pedido
    {
        UsuarioId = usuarioId,
        Estado = "Pendiente",
        Fecha = DateTime.UtcNow
    };

    foreach (var item in carrito.Productos)
    {
        if (item.Producto == null)
        {
            continue;
        }

        if (item.Producto.UsuarioId == usuarioId)
        {
            return "No puedes comprar tus propios productos.";
        }

        pedido.Productos.Add(new PedidoProducto
        {
            ProductoId = item.ProductoId,
            Cantidad = item.Cantidad,
            Precio = (decimal)item.Producto.Valor
        });
    }

    pedido.Total = pedido.Productos.Sum(x => x.Precio * x.Cantidad);

    await _context.Pedido.AddAsync(pedido);
    _context.CarritoProducto.RemoveRange(carrito.Productos);
    await _context.SaveChangesAsync();

    return "Pedido creado correctamente.";
}
```

## 9. Obtener pedidos del usuario

```csharp
public async Task<List<PedidoDto>> ObtenerPedidos(int usuarioId)
{
    return await _context.Pedido
        .Where(x => x.UsuarioId == usuarioId)
        .Select(x => new PedidoDto
        {
            Id = x.Id,
            Fecha = x.Fecha,
            Estado = x.Estado,
            Total = x.Total,
            Productos = x.Productos
                .Select(p => new PedidoProductoDto
                {
                    ProductoId = p.ProductoId,
                    Nombre = p.Producto!.Nombre,
                    ImagenUrl = p.Producto.ImagenUrl,
                    Cantidad = p.Cantidad,
                    Precio = p.Precio
                }).ToList()
        }).ToListAsync();
}
```

## 10. Obtener un pedido

```csharp
public async Task<PedidoDto?> ObtenerPedido(int usuarioId, int pedidoId)
{
    return await _context.Pedido
        .Where(x => x.Id == pedidoId && x.UsuarioId == usuarioId)
        .Select(x => new PedidoDto
        {
            Id = x.Id,
            Fecha = x.Fecha,
            Estado = x.Estado,
            Total = x.Total,
            Productos = x.Productos
                .Select(p => new PedidoProductoDto
                {
                    ProductoId = p.ProductoId,
                    Nombre = p.Producto!.Nombre,
                    ImagenUrl = p.Producto.ImagenUrl,
                    Cantidad = p.Cantidad,
                    Precio = p.Precio
                }).ToList()
        }).FirstOrDefaultAsync();
}
```

## 11. Crear PedidoController

En la carpeta `Controllers` creamos un controlador llamado `PedidoController` y dentro de él agregamos lo siguiente.

Inyectamos el repositorio:

```csharp
private readonly IPedidoRepository _pedidoRepository;
```

Creamos el constructor:

```csharp
public PedidoController(IPedidoRepository pedidoRepository)
{
    _pedidoRepository = pedidoRepository;
}
```

Creamos los métodos HTTP correspondientes para llamar a los métodos de nuestro repositorio:

```csharp
[Authorize]
[HttpPost("CrearPedido")]
public async Task<IActionResult> Crear()
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return Ok(await _pedidoRepository.CrearPedido(userId));
}

[Authorize]
[HttpGet("GetPedidos")]
public async Task<List<PedidoDto>> Obtener()
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return await _pedidoRepository.ObtenerPedidos(userId);
}

[Authorize]
[HttpGet("GetPedido/{pedidoId}")]
public async Task<PedidoDto> Obtener([FromRoute] int pedidoId)
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return await _pedidoRepository.ObtenerPedido(userId, pedidoId);
}
```
