{
  description = "KARG - Kubernetes API Reference Generator";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ] (system:
      let
        pkgs = import nixpkgs { inherit system; };
        
        version = "0.11.0"; #version - This line is replaced by CI
        
        assetName = "karg-v${version}-${system}.tar.gz";
        
        # Hashes for each platform (will be updated by CI)
        hashes = {
          "x86_64-linux" = {
            hash = "sha256:357ba1e9f63077ae8ebe730e32f84f88f756a1b36d1cb0f3d152996026890a08"; #x86_64-linux - This line is replaced by CI
          };
          "aarch64-linux" = {
            hash = "sha256:4bee59b32cc6154799c67093a377c655818453d17170959aa0a5adeca74db7fe"; #aarch64-linux - This line is replaced by CI
          };
          "x86_64-darwin" = {
            hash = "sha256:b1ca0ef1f74001fe4f0ccc052a8ba9c97cad036be46883652c6fc80f856c8959"; #x86_64-darwin - This line is replaced by CI
          };
          "aarch64-darwin" = {
            hash = "sha256:b415f26e6a7c82f8450909453b131d6482d26bfb4a51470e1b94f13a1782f594"; #aarch64-darwin - This line is replaced by CI
          };
        };
        
      in {
        packages = {
          default = self.packages.${system}.karg;
          
          karg = pkgs.stdenvNoCC.mkDerivation {
            pname = "karg";
            inherit version;

            src = pkgs.fetchurl {
              url = "https://github.com/suinplayground/distribute-binary-via-devbox/releases/download/v${version}/${assetName}"; #github-url - This line is replaced by CI
              inherit (hashes.${system}) hash;
            };

            nativeBuildInputs = [ pkgs.gnutar pkgs.gzip ];

            unpackPhase = ''
              tar --strip-components=1 -xzf $src
            '';

            installPhase = ''
              mkdir -p $out/bin
              cp karg $out/bin/
              chmod +x $out/bin/karg
            '';

            meta = with pkgs.lib; {
              description = "KARG - Kubernetes API Reference Generator. Generate documentation from Kubernetes CRD YAML files";
              homepage = "https://github.com/suinplayground/distribute-binary-via-devbox"; #github-homepage - This line is replaced by CI
              license = licenses.mit;
              maintainers = [ ];
              platforms = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
              mainProgram = "karg";
            };
          };
        };
        
        # For `nix run`
        apps.default = {
          type = "app";
          program = "${self.packages.${system}.karg}/bin/karg";
        };
      }
    );
} 