# Guía 2 — Carrito de compras

## Objetivo

En esta guía se ampliará el e-commerce construido en la Guía 1 para permitir que los usuarios:

- Tengan un carrito de compras.
- Agreguen productos al carrito.
- Modifiquen cantidades.
- Eliminen productos.
- Consulten el contenido del carrito.
- Eviten comprar sus propios productos.

## 1. Crear la clase Carrito

En la carpeta `Models` vamos a crear la siguiente clase:

```csharp
public class Carrito
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public ICollection<CarritoProducto> Productos { get; set; } = new List<CarritoProducto>();
}
```

## 2. Crear CarritoProducto

Necesitamos una clase intermedia porque un carrito puede contener muchos productos y un producto puede aparecer en diferentes carritos.

En la carpeta `Models` vamos a crear la siguiente clase:

```csharp
public class CarritoProducto
{
    public int Id { get; set; }
    public int CarritoId { get; set; }
    public Carrito? Carrito { get; set; }
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }
    public int Cantidad { get; set; }
}
```

## 3. Agregar los DbSet

En el archivo `AppDbContext` agregar los siguientes DbSets:

```csharp
public DbSet<Carrito> Carrito { get; set; }
public DbSet<CarritoProducto> CarritoProducto { get; set; }
```

## 4. Modificar Usuario

Modificarlo para relacionarlo con el carrito agregando el siguiente atributo:

```csharp
public Carrito? Carrito { get; set; }
```

## 5. Crear la migración

```bash
dotnet ef migrations add AddCarrito
dotnet ef database update
```

## 6. Crear DTOs

En la carpeta `DTOs` crear las siguientes clases:

```csharp
public class AddProductDto
{
    public int ProductId { get; set; }
    public int Cantidad { get; set; }
}

public class CarritoDto
{
    public int CarritoId { get; set; }
    public List<CarritoProductoDto> Productos { get; set; } = new();
    public double Total { get; set; }
}

public class CarritoProductoDto
{
    public int ProductoId { get; set; }
    public string? Nombre { get; set; }
    public string? ImagenUrl { get; set; }
    public double Precio { get; set; }
    public int Cantidad { get; set; }
    public double Subtotal { get; set; }
}
```

## 7. Crear CarritoRepository

Crear la interfaz `ICarritoRepository` en la carpeta `Interfaces`:

```csharp
public interface ICarritoRepository
{
    Task<CarritoDto> ObtenerCarrito(int usuarioId);
    Task<string> AgregarProducto(int usuarioId, AddProductDto item);
    Task<string> ActualizarProducto(int usuarioId, AddProductDto item);
    Task<string> EliminarProducto(int usuarioId, int productoId);
    Task<string> VaciarCarrito(int usuarioId);
}
```

En la carpeta `Repositories` crear el repositorio `CarritoRepository` implementando la interfaz:

```csharp
public class CarritoRepository : ICarritoRepository
{
}
```

Registrar el repositorio:

```csharp
builder.Services.AddScoped<ICarritoRepository, CarritoRepository>();
```

## 8. Obtener o crear el carrito

```csharp
private async Task<Carrito> ObtenerCarritoLocal(int usuarioId)
{
    var carrito = await _context.Carrito.FirstOrDefaultAsync(x => x.UsuarioId == usuarioId);

    if (carrito == null)
    {
        carrito = new Carrito
        {
            UsuarioId = usuarioId
        };

        await _context.Carrito.AddAsync(carrito);
        await _context.SaveChangesAsync();
    }

    return carrito;
}
```

Así no necesitamos crear manualmente un carrito cuando un usuario se registra. El carrito se crea cuando el usuario lo utiliza por primera vez.

## 9. Agregar producto al carrito

```csharp
public async Task<string> AgregarProducto(int usuarioId, AddProductDto item)
{
    var producto = await _context.Producto.FirstOrDefaultAsync(x => x.Id == item.ProductId);

    if (producto == null)
    {
        return "El producto no existe.";
    }

    if (producto.UsuarioId == usuarioId)
    {
        return "No puedes comprar tu propio producto.";
    }

    var carrito = await ObtenerCarritoLocal(usuarioId);

    var productoCarrito = await _context.CarritoProducto.FirstOrDefaultAsync(x =>
        x.CarritoId == carrito.Id && x.ProductoId == item.ProductId);

    if (productoCarrito == null)
    {
        productoCarrito = new CarritoProducto
        {
            CarritoId = carrito.Id,
            ProductoId = item.ProductId,
            Cantidad = item.Cantidad
        };

        await _context.CarritoProducto.AddAsync(productoCarrito);
    }
    else
    {
        productoCarrito.Cantidad += item.Cantidad;
    }

    await _context.SaveChangesAsync();

    return "Producto agregado al carrito.";
}
```

## 10. Obtener el carrito

```csharp
public async Task<CarritoDto> ObtenerCarrito(int usuarioId)
{
    var carrito = await ObtenerCarritoLocal(usuarioId);

    var productos = await _context.CarritoProducto
        .Where(x => x.CarritoId == carrito.Id)
        .Select(x => new CarritoProductoDto
        {
            ProductoId = x.ProductoId,
            Nombre = x.Producto!.Nombre,
            ImagenUrl = x.Producto.ImagenUrl,
            Precio = x.Producto.Valor,
            Cantidad = x.Cantidad,
            Subtotal = x.Producto.Valor * x.Cantidad
        })
        .ToListAsync();

    return new CarritoDto
    {
        CarritoId = carrito.Id,
        Productos = productos,
        Total = productos.Sum(x => x.Subtotal)
    };
}
```

## 11. Actualizar cantidad

```csharp
public async Task<string> ActualizarProducto(int usuarioId, AddProductDto item)
{
    var carrito = await ObtenerCarritoLocal(usuarioId);

    var product = await _context.CarritoProducto.FirstOrDefaultAsync(x =>
        x.CarritoId == carrito.Id && x.ProductoId == item.ProductId);

    if (product == null)
    {
        return "El producto no está en el carrito.";
    }

    product.Cantidad = item.Cantidad;
    await _context.SaveChangesAsync();

    return "Cantidad actualizada.";
}
```

## 12. Eliminar producto

```csharp
public async Task<string> EliminarProducto(int usuarioId, int productoId)
{
    var carrito = await ObtenerCarritoLocal(usuarioId);

    var item = await _context.CarritoProducto.FirstOrDefaultAsync(x =>
        x.CarritoId == carrito.Id && x.ProductoId == productoId);

    if (item == null)
    {
        return "El producto no está en el carrito.";
    }

    _context.CarritoProducto.Remove(item);
    await _context.SaveChangesAsync();

    return "Producto eliminado del carrito.";
}
```

## 13. Vaciar carrito

```csharp
public async Task<string> VaciarCarrito(int usuarioId)
{
    var carrito = await ObtenerCarritoLocal(usuarioId);

    var productos = await _context.CarritoProducto
        .Where(x => x.CarritoId == carrito.Id)
        .ToListAsync();

    _context.CarritoProducto.RemoveRange(productos);
    await _context.SaveChangesAsync();

    return "Carrito vaciado.";
}
```

## 14. Crear CarritoController

En la carpeta `Controllers` creamos un controlador llamado `CarritoController` y dentro de él agregamos lo siguiente.

Inyectamos el repositorio:

```csharp
private readonly ICarritoRepository _carritoRepository;
```

Creamos el constructor:

```csharp
public CarritoController(ICarritoRepository carritoRepository)
{
    _carritoRepository = carritoRepository;
}
```

Creamos los métodos HTTP correspondientes para llamar a los métodos de nuestro repositorio:

```csharp
[Authorize]
[HttpGet("GetCarrito")]
public async Task<IActionResult> Obtener()
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return Ok(await _carritoRepository.ObtenerCarrito(userId));
}

[Authorize]
[HttpPost("AgregarProducto")]
public async Task<IActionResult> Agregar([FromBody] AddProductDto item)
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return Ok(await _carritoRepository.AgregarProducto(userId, item));
}

[Authorize]
[HttpPut("ActualizarCarrito")]
public async Task<IActionResult> Actualizar([FromBody] AddProductDto item)
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return Ok(await _carritoRepository.ActualizarProducto(userId, item));
}

[Authorize]
[HttpDelete("EliminarProducto/{productId}")]
public async Task<IActionResult> Eliminar([FromRoute] int productId)
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return Ok(await _carritoRepository.EliminarProducto(userId, productId));
}

[Authorize]
[HttpDelete("VaciarCarrito")]
public async Task<IActionResult> Vaciar()
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    return Ok(await _carritoRepository.VaciarCarrito(userId));
}
```
