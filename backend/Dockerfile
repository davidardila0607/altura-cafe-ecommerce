# API de Altura (ASP.NET Core 10) para Railway.
# Dos etapas: la imagen grande del SDK compila y publica; la imagen pequeña de ASP.NET solo ejecuta.
# Railway la usa sola si el servicio tiene Root Directory = backend (busca un "Dockerfile" en esa carpeta).

# ===== 1. Compilar y publicar =====
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS compilar
WORKDIR /src

# Primero solo el proyecto: si no cambian los paquetes, Docker reutiliza el "restore" de la vez anterior.
COPY CafeApi.csproj ./
RUN dotnet restore CafeApi.csproj

# Después el resto del código (lo que excluye .dockerignore no entra: secretos, bin, obj, seed…).
COPY . ./
RUN dotnet publish CafeApi.csproj -c Release -o /app --no-restore

# ===== 2. Ejecutar =====
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=compilar /app ./

# Producción: sin Swagger. Program.cs escucha en http://0.0.0.0:$PORT (Railway pone PORT);
# si PORT no existe (por ejemplo, al probar la imagen en local), usa 8080.
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
EXPOSE 8080

# La imagen de ASP.NET trae un usuario sin privilegios (APP_UID): la API no corre como root.
USER $APP_UID

ENTRYPOINT ["dotnet", "CafeApi.dll"]
