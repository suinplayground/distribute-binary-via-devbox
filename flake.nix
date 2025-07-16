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
        
        version = "v0.3.0"; #version - This line is replaced by CI
        
        assetName = "karg-${version}-${system}.tar.gz";
        
        # Hashes for each platform (will be updated by CI)
        hashes = {
          "x86_64-linux" = {
            hash = "sha256-c22mzw4yHxpA6tsXADw1WQOAK5wVHQzANPL+WDscYv0="; #x86_64-linux - This line is replaced by CI
          };
          "aarch64-linux" = {
            hash = "sha256-QQyIHZy7e6zLA6bb/kQArIllaSuIl/yIzqHjbGESzWs="; #aarch64-linux - This line is replaced by CI
          };
          "x86_64-darwin" = {
            hash = "sha256-zzQGZAQuPsiw6Anu429jfk1UmfVkoviOriaf+h9jwFw="; #x86_64-darwin - This line is replaced by CI
          };
          "aarch64-darwin" = {
            hash = "sha256-nCzrNbnHvw08LG0y9t5aiPGyjhMHCqwmDp4Q4Pmo4S8="; #aarch64-darwin - This line is replaced by CI
          };
        };
        
      in {
        packages = {
          default = self.packages.${system}.karg;
          
          karg = pkgs.stdenvNoCC.mkDerivation {
            pname = "karg";
            inherit version;

            src = pkgs.fetchurl {
              url = "https://github.com/suinplayground/distribute-binary-via-devbox/releases/download/${version}/${assetName}"; #github-url - This line is replaced by CI
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