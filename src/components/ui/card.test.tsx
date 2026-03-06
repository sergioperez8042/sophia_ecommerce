import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  describe('Renderizado basico', () => {
    it('se renderiza sin errores', () => {
      render(<Card data-testid="card">Contenido</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renderiza el contenido hijo', () => {
      render(<Card>Contenido de la tarjeta</Card>);
      expect(screen.getByText('Contenido de la tarjeta')).toBeInTheDocument();
    });

    it('aplica las clases base', () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('border');
      expect(card.className).toContain('shadow-sm');
    });
  });

  describe('Clase CSS personalizada', () => {
    it('acepta clases CSS adicionales', () => {
      render(<Card data-testid="card" className="w-96">Test</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('w-96');
    });
  });

  describe('Forwarded ref', () => {
    it('soporta ref forwarding', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Test</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe('CardHeader', () => {
  it('se renderiza sin errores', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('aplica las clases base', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header.className).toContain('flex');
    expect(header.className).toContain('flex-col');
    expect(header.className).toContain('p-6');
  });

  it('acepta clases CSS adicionales', () => {
    render(<CardHeader data-testid="header" className="bg-green-50">Header</CardHeader>);
    expect(screen.getByTestId('header').className).toContain('bg-green-50');
  });

  it('soporta ref forwarding', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Test</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle', () => {
  it('se renderiza sin errores', () => {
    render(<CardTitle>Titulo de la tarjeta</CardTitle>);
    expect(screen.getByText('Titulo de la tarjeta')).toBeInTheDocument();
  });

  it('renderiza como un elemento h3', () => {
    render(<CardTitle>Titulo</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('aplica las clases de tipografia', () => {
    render(<CardTitle>Titulo</CardTitle>);
    const title = screen.getByText('Titulo');
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('font-semibold');
  });

  it('acepta clases CSS adicionales', () => {
    render(<CardTitle className="text-red-500">Titulo</CardTitle>);
    expect(screen.getByText('Titulo').className).toContain('text-red-500');
  });

  it('soporta ref forwarding', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<CardTitle ref={ref}>Test</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('CardDescription', () => {
  it('se renderiza sin errores', () => {
    render(<CardDescription>Descripcion de la tarjeta</CardDescription>);
    expect(screen.getByText('Descripcion de la tarjeta')).toBeInTheDocument();
  });

  it('renderiza como un elemento p', () => {
    render(<CardDescription>Desc</CardDescription>);
    const desc = screen.getByText('Desc');
    expect(desc.tagName).toBe('P');
  });

  it('aplica las clases base', () => {
    render(<CardDescription>Desc</CardDescription>);
    const desc = screen.getByText('Desc');
    expect(desc.className).toContain('text-sm');
    expect(desc.className).toContain('text-muted-foreground');
  });

  it('soporta ref forwarding', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref}>Test</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('CardContent', () => {
  it('se renderiza sin errores', () => {
    render(<CardContent data-testid="content">Contenido</CardContent>);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('aplica las clases base', () => {
    render(<CardContent data-testid="content">Contenido</CardContent>);
    const content = screen.getByTestId('content');
    expect(content.className).toContain('p-6');
    expect(content.className).toContain('pt-0');
  });

  it('soporta ref forwarding', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>Test</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('se renderiza sin errores', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('aplica las clases base', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('flex');
    expect(footer.className).toContain('items-center');
    expect(footer.className).toContain('p-6');
    expect(footer.className).toContain('pt-0');
  });

  it('soporta ref forwarding', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Test</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Composicion completa de Card', () => {
  it('renderiza todos los sub-componentes juntos correctamente', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Producto destacado</CardTitle>
          <CardDescription>Cosmetica natural</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido del producto</p>
        </CardContent>
        <CardFooter>
          <button>Comprar</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('full-card')).toBeInTheDocument();
    expect(screen.getByText('Producto destacado')).toBeInTheDocument();
    expect(screen.getByText('Cosmetica natural')).toBeInTheDocument();
    expect(screen.getByText('Contenido del producto')).toBeInTheDocument();
    expect(screen.getByText('Comprar')).toBeInTheDocument();
  });
});
